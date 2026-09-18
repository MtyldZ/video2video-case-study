"use client";

import { CopyOutlined, DownloadOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, App, Button, Col, Flex, Popconfirm, Result, Row, Spin, theme, Typography } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { describeParams, isActive, jobTitle, StatusTag, VideoPlayer } from "@/components/JobParts";
import { fetchHistory, retryTransform } from "@/lib/api";
import { downloadUrl } from "@/lib/media";
import type { HistoryItem } from "@/lib/schemas";

const POLL_MS = 5000;

function ProcessingArt() {
  const { token } = theme.useToken();
  return (
    <svg width="220" height="120" viewBox="0 0 220 120" fill="none" aria-hidden="true" style={{ maxWidth: "100%" }}>
      <rect x="6" y="18" width="92" height="84" rx="10" stroke={token.colorBorder} strokeWidth="2" />
      <rect x="122" y="18" width="92" height="84" rx="10" fill={token.colorPrimaryBg} />
      <g className="vv-pulse">
        <rect x="20" y="32" width="28" height="28" rx="4" fill={token.colorBorder} />
        <rect x="56" y="32" width="28" height="28" rx="4" fill={token.colorBorder} />
        <rect x="20" y="66" width="28" height="28" rx="4" fill={token.colorBorder} />
        <rect x="56" y="66" width="28" height="28" rx="4" fill={token.colorBorder} />
      </g>
      <g className="vv-pulse" style={{ animationDelay: ".6s" }}>
        <circle cx="150" cy="46" r="14" fill={token.colorPrimary} />
        <rect x="172" y="32" width="28" height="28" rx="14" fill={token.colorPrimary} opacity=".55" />
        <path d="M136 94 L150 68 L164 94 Z" fill={token.colorPrimary} opacity=".8" />
        <rect x="172" y="66" width="28" height="28" rx="4" fill={token.colorPrimary} opacity=".35" />
      </g>
      <path d="M104 60 L118 60 M112 54 L118 60 L112 66" stroke={token.colorPrimary} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  jobId: string;
  onRetried: (id: string) => void;
  onChangeSettings: () => void;
  onNew: () => void;
}

// Processing step: follows one job via /api/history until it finishes.
export function JobStatus({ jobId, onRetried, onChangeSettings, onNew }: Props) {
  const { message } = App.useApp();
  const [item, setItem] = useState<HistoryItem | null>();
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(
    () =>
      fetchHistory()
        .then((items) => {
          setItem(items.find((i) => i._id === jobId) ?? null);
          setError(undefined);
        })
        .catch((e: Error) => setError(e.message)),
    [jobId],
  );

  useEffect(() => {
    let cancelled = false;
    fetchHistory()
      .then((items) => !cancelled && setItem(items.find((i) => i._id === jobId) ?? null))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const active = !!item && isActive(item.status);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [active, load]);

  async function retry() {
    if (!item) return;
    setRetrying(true);
    try {
      onRetried((await retryTransform(item)).id);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRetrying(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    message.success("Link copied");
  }

  const retryButton = (
    <Popconfirm key="retry" title="Start a new render?" description="This runs the job again and uses credits." onConfirm={retry}>
      <Button type="primary" icon={<ReloadOutlined />} loading={retrying}>
        Retry render
      </Button>
    </Popconfirm>
  );
  const historyButton = (
    <Link key="history" href="/history">
      <Button type="text">Go to History</Button>
    </Link>
  );

  if (item === undefined && !error) return <Spin size="large" style={{ display: "block", padding: 48 }} />;
  if (item === undefined || item === null) {
    return (
      <Result
        status="warning"
        title="Couldn't load this job"
        subTitle={error ?? "It may have been created in another browser."}
        extra={[<Button key="again" onClick={load}>Try again</Button>, historyButton]}
      />
    );
  }

  if (active) {
    return (
      <Flex vertical align="center" gap={16} style={{ padding: "24px 0 8px", textAlign: "center" }}>
        <ProcessingArt />
        <Flex align="center" gap={10}>
          <Spin size="small" />
          <Typography.Title level={4} style={{ margin: 0 }}>
            {item.status === "pending" ? "Queued" : "Rendering your video"}
          </Typography.Title>
        </Flex>
        <Typography.Text type="secondary">Each frame is restyled, then reassembled into video. Most jobs finish in a few minutes.</Typography.Text>
        <Alert
          type="info"
          showIcon
          title="You can leave this page. The result will appear in History."
          action={<Link href="/history"><Button size="small" type="text">History</Button></Link>}
          style={{ maxWidth: 480, textAlign: "left" }}
        />
      </Flex>
    );
  }

  if (item.status === "complete") {
    return (
      <Flex vertical gap={16}>
        <Flex align="center" gap={10} wrap>
          <StatusTag status="complete" />
          <Typography.Title level={4} style={{ margin: 0 }}>
            {jobTitle(item)}
          </Typography.Title>
        </Flex>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {describeParams(item)}
        </Typography.Text>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <VideoPlayer label="Before" url={item.sourceUrl} />
          </Col>
          <Col xs={24} md={12}>
            <VideoPlayer label={`After · ${item.params.style.art_style}`} url={item.resultUrl} />
          </Col>
        </Row>
        <Flex gap={8} wrap>
          <Button type="primary" icon={<DownloadOutlined />} href={item.resultUrl && downloadUrl(item.resultUrl)}>
            Download result
          </Button>
          <Button icon={<CopyOutlined />} onClick={() => item.resultUrl && copy(item.resultUrl)}>
            Copy link
          </Button>
          <Button type="text" icon={<PlusOutlined />} onClick={onNew}>
            Transform another
          </Button>
        </Flex>
      </Flex>
    );
  }

  if (item.status === "failed") {
    return (
      <Result
        status="error"
        title="Render failed"
        subTitle={item.error ?? "Magic Hour could not render this clip."}
        extra={[retryButton, <Button key="settings" onClick={onChangeSettings}>Change settings</Button>, historyButton]}
      />
    );
  }

  return (
    <Result
      status="warning"
      title="Still no result"
      subTitle={item.error}
      extra={[
        <Button key="check" icon={<ReloadOutlined />} loading={checking} onClick={() => { setChecking(true); load().finally(() => setChecking(false)); }}>
          Check again
        </Button>,
        retryButton,
        historyButton,
      ]}
    />
  );
}
