"use client";

import { CopyOutlined, DownloadOutlined, LinkOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Flex,
  Grid,
  Popconfirm,
  Result,
  Row,
  Skeleton,
  Spin,
  theme,
  Typography,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { describeParams, isActive, jobTitle, StatusTag, VideoPlayer } from "@/components/JobParts";
import { fetchHistory, retryTransform } from "@/lib/api";
import { downloadUrl, posterUrl } from "@/lib/media";
import type { HistoryItem } from "@/lib/schemas";

const POLL_MS = 5000;

function Thumb({ url, label, at }: { url?: string; label: string; at?: number }) {
  const { token } = theme.useToken();
  if (!url) return <VideoPlayer placeholder={label} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves an optimized frame
    <img
      src={posterUrl(url, at)}
      alt={label}
      loading="lazy"
      style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: token.borderRadius, background: "#000", display: "block" }}
    />
  );
}

function EmptyHistory() {
  const { token } = theme.useToken();
  return (
    <Card>
      <Flex vertical align="center" gap={8} style={{ padding: "32px 0", textAlign: "center" }}>
        <svg width="160" height="104" viewBox="0 0 160 104" fill="none" aria-hidden="true">
          <rect x="4" y="16" width="70" height="72" rx="10" stroke={token.colorBorder} strokeWidth="2" strokeDasharray="6 6" />
          <rect x="86" y="16" width="70" height="72" rx="10" stroke={token.colorBorder} strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="39" cy="52" r="10" fill={token.colorBorderSecondary} />
          <path d="M112 44 L128 52 L112 60 Z" fill={token.colorPrimaryBg} />
        </svg>
        <Typography.Title level={4} style={{ margin: "10px 0 0" }}>
          No transformations yet
        </Typography.Title>
        <Typography.Text type="secondary">Renders you start will show up here with their parameters and both videos.</Typography.Text>
        <Link href="/" style={{ marginTop: 12 }}>
          <Button type="primary" icon={<PlusOutlined />}>
            Create your first transformation
          </Button>
        </Link>
      </Flex>
    </Card>
  );
}

export function HistoryList() {
  const { message } = App.useApp();
  const isMobile = Grid.useBreakpoint().sm === false;
  const [items, setItems] = useState<HistoryItem[]>();
  const [error, setError] = useState<string>();
  const [openId, setOpenId] = useState<string>();
  const [retrying, setRetrying] = useState<string>();

  const load = useCallback(
    () =>
      fetchHistory()
        .then((i) => {
          setItems(i);
          setError(undefined);
        })
        .catch((e: Error) => setError(e.message)),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    fetchHistory()
      .then((i) => !cancelled && setItems(i))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll only while something is still running.
  const running = items?.filter((i) => isActive(i.status)).length ?? 0;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [running, load]);

  async function copy(text: string, what: string) {
    await navigator.clipboard.writeText(text);
    message.success(`${what} copied`);
  }

  async function retry(item: HistoryItem) {
    setRetrying(item._id);
    try {
      await retryTransform(item);
      message.success("New render started");
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRetrying(undefined);
    }
  }

  const header = (
    <Flex align="flex-end" justify="space-between" gap={16} wrap>
      <div>
        <Typography.Title level={isMobile ? 3 : 2} style={{ margin: "0 0 4px" }}>
          History
        </Typography.Title>
        <Typography.Text type="secondary">Every transformation, with the exact parameters used.</Typography.Text>
      </div>
      {running > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <Spin size="small" /> {running} job{running > 1 ? "s" : ""} rendering · auto-refresh on
        </Typography.Text>
      )}
    </Flex>
  );

  let body: React.ReactNode;
  if (!items && error) {
    body = (
      <Card>
        <Result
          status="500"
          title="Couldn't load your history"
          subTitle={`${error} Your renders are safe.`}
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={load}>Try again</Button>}
        />
      </Card>
    );
  } else if (!items) {
    body = [1, 2, 3].map((k) => (
      <Card key={k}>
        <Skeleton active avatar={{ shape: "square", size: 64 }} paragraph={{ rows: 2 }} />
      </Card>
    ));
  } else if (items.length === 0) {
    body = <EmptyHistory />;
  } else {
    body = items.map((item) => (
      <Card key={item._id} size="small">
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={10} md={8} lg={6}>
            <Flex gap={8}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Thumb url={item.sourceUrl} label="source" at={Math.floor(item.params.start_seconds)} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Thumb url={item.resultUrl} label={isActive(item.status) ? "rendering…" : "no result"} />
              </div>
            </Flex>
          </Col>
          <Col xs={24} sm={14} md={16} lg={18}>
            <Flex vertical gap={6}>
              <Flex gap={10} align="center" wrap>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {jobTitle(item)}
                </Typography.Text>
                <StatusTag status={item.status} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {describeParams(item)}
              </Typography.Text>
              {item.error && (
                <Typography.Text type={item.status === "timed_out" ? "warning" : "danger"} style={{ fontSize: 13 }}>
                  {item.error}
                </Typography.Text>
              )}
              <Flex gap={4} wrap>
                <Button size="small" icon={<PlayCircleOutlined />} onClick={() => setOpenId(item._id)}>
                  {item.status === "complete" ? "Compare" : "View"}
                </Button>
                {item.resultUrl && (
                  <>
                    <Button size="small" type="text" icon={<DownloadOutlined />} href={downloadUrl(item.resultUrl)}>
                      Download
                    </Button>
                    <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(item.resultUrl!, "Result link")}>
                      Copy result
                    </Button>
                  </>
                )}
                <Button size="small" type="text" icon={<LinkOutlined />} onClick={() => copy(item.sourceUrl, "Source link")}>
                  Copy source
                </Button>
                {(item.status === "failed" || item.status === "timed_out") && (
                  <Popconfirm title="Start a new render?" description="This runs the job again and uses credits." onConfirm={() => retry(item)}>
                    <Button size="small" type="text" icon={<ReloadOutlined />} loading={retrying === item._id}>
                      Retry
                    </Button>
                  </Popconfirm>
                )}
              </Flex>
            </Flex>
          </Col>
        </Row>
      </Card>
    ));
  }

  const open = items?.find((i) => i._id === openId);

  return (
    <Flex vertical gap={20}>
      {header}
      {items && error && <Alert type="warning" showIcon title={`Couldn't refresh: ${error}`} />}
      <Flex vertical gap={12}>
        {body}
      </Flex>

      <Drawer
        key={isMobile ? "bottom" : "right"} // remount on placement change; switching mid-animation strands the panel
        open={!!open}
        onClose={() => setOpenId(undefined)}
        placement={isMobile ? "bottom" : "right"}
        size={isMobile ? "86%" : 560}
        title={open && jobTitle(open)}
        extra={open && <StatusTag status={open.status} />}
      >
        {open && (
          <Flex vertical gap={20}>
            {open.error && <Alert type={open.status === "timed_out" ? "warning" : "error"} showIcon title={open.error} />}
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <VideoPlayer label="Source" url={open.sourceUrl} range={{ start: open.params.start_seconds, end: open.params.end_seconds }} />
              </Col>
              <Col xs={24} md={12}>
                <VideoPlayer label="Result" url={open.resultUrl} />
              </Col>
            </Row>
            <Descriptions
              size="small"
              bordered
              column={1}
              items={[
                { key: "id", label: "Job ID", children: <Typography.Text copyable style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, wordBreak: "break-all" }}>{open.mhJobId ?? open._id}</Typography.Text> },
                { key: "created", label: "Created", children: new Date(open.createdAt).toLocaleString() },
                { key: "style", label: "Art style", children: open.params.style.art_style },
                { key: "model", label: "Model", children: open.params.style.model },
                { key: "version", label: "Style version", children: open.params.style.version },
                { key: "clip", label: "Clip range", children: `${open.params.start_seconds}–${open.params.end_seconds}s` },
                { key: "fps", label: "Frame rate", children: open.params.fps_resolution },
                { key: "ptype", label: "Prompt type", children: open.params.style.prompt_type },
                ...(open.params.style.prompt ? [{ key: "prompt", label: "Prompt", children: open.params.style.prompt }] : []),
                { key: "credits", label: "Credits", children: open.creditsCharged ?? "—" },
                {
                  key: "src",
                  label: "Source URL",
                  children: <Typography.Text copyable style={{ fontSize: 12, wordBreak: "break-all" }}>{open.sourceUrl}</Typography.Text>,
                },
                {
                  key: "res",
                  label: "Result URL",
                  children: open.resultUrl ? (
                    <Typography.Text copyable style={{ fontSize: 12, wordBreak: "break-all" }}>{open.resultUrl}</Typography.Text>
                  ) : (
                    "—"
                  ),
                },
              ]}
            />
            {open.resultUrl && (
              <Button type="primary" icon={<DownloadOutlined />} href={downloadUrl(open.resultUrl)}>
                Download result
              </Button>
            )}
          </Flex>
        )}
      </Drawer>
    </Flex>
  );
}
