"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Flex, Row, Skeleton, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import type { HistoryItem, TransformStatus } from "@/lib/schemas";

const POLL_MS = 5000;

const STATUS: Record<TransformStatus, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: "default", label: "Pending", icon: <ClockCircleOutlined /> },
  processing: { color: "processing", label: "Processing", icon: <SyncOutlined spin /> },
  complete: { color: "success", label: "Complete", icon: <CheckCircleOutlined /> },
  failed: { color: "error", label: "Failed", icon: <CloseCircleOutlined /> },
  timed_out: { color: "warning", label: "Timed out", icon: <ExclamationCircleOutlined /> },
};

const isActive = (s: TransformStatus) => s === "pending" || s === "processing";

// Cloudinary serves a video frame when the extension is swapped to .jpg.
const poster = (videoUrl: string) => videoUrl.replace(/\.\w+$/, ".jpg");

function describe(p: HistoryItem["params"]) {
  const prompt = p.style.prompt_type === "default" ? "style prompt" : `${p.style.prompt_type} prompt`;
  return [
    p.style.art_style,
    `${p.start_seconds}–${p.end_seconds}s`,
    p.fps_resolution,
    `model ${p.style.model}`,
    `version ${p.style.version}`,
    prompt,
  ].join(" · ");
}

function VideoBox({ label, url }: { label: string; url?: string }) {
  return (
    <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      {url ? (
        <video src={url} poster={poster(url)} controls playsInline preload="none" style={{ width: "100%", aspectRatio: "16 / 9", background: "#000", borderRadius: 8 }} />
      ) : (
        <Flex align="center" justify="center" style={{ aspectRatio: "16 / 9", background: "rgba(0,0,0,0.04)", borderRadius: 8 }}>
          <Typography.Text type="secondary">No result yet</Typography.Text>
        </Flex>
      )}
    </Flex>
  );
}

type Fetched = { items: HistoryItem[] } | { error: string };

async function fetchHistory(): Promise<Fetched> {
  try {
    const res = await fetch("/api/history", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { items: data.items } : { error: data.error ?? "Could not load your history." };
  } catch {
    return { error: "Network error. Check your connection." };
  }
}

export function HistoryList({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<HistoryItem[]>();
  const [error, setError] = useState<string>();

  const apply = useCallback((r: Fetched) => {
    if ("items" in r) setItems(r.items);
    setError("error" in r ? r.error : undefined);
  }, []);
  const load = useCallback(() => fetchHistory().then(apply), [apply]);

  // Fetch on mount and whenever a new transformation is submitted.
  useEffect(() => {
    let cancelled = false;
    fetchHistory().then((r) => !cancelled && apply(r));
    return () => {
      cancelled = true;
    };
  }, [apply, refreshKey]);

  // Poll only while something is still running.
  const running = items?.some((i) => isActive(i.status)) ?? false;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [running, load]);

  if (!items && !error) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <Flex vertical gap={12}>
      {error && (
        <Alert type="error" showIcon title={error} action={<Button size="small" onClick={load}>Retry</Button>} />
      )}
      {items?.length === 0 && <Empty description="No transformations yet. Upload a video to get started." />}
      {running && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <SyncOutlined spin /> Updating automatically while jobs are running…
        </Typography.Text>
      )}
      {items?.map((item) => {
        const s = STATUS[item.status];
        return (
          <Card key={item._id} size="small">
            <Flex vertical gap={8}>
              <Flex gap={8} align="center" wrap>
                <Typography.Text strong>{item.params.name || item.params.style.art_style}</Typography.Text>
                <Tag color={s.color} icon={s.icon}>{s.label}</Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {describe(item.params)}
                {item.creditsCharged != null && ` · ${item.creditsCharged} credits`}
              </Typography.Text>
              {item.error && <Typography.Text type={item.status === "timed_out" ? "warning" : "danger"}>{item.error}</Typography.Text>}
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <VideoBox label="Source" url={item.sourceUrl} />
                </Col>
                <Col xs={24} sm={12}>
                  <VideoBox label="Result" url={item.resultUrl} />
                </Col>
              </Row>
              <Flex gap={4} wrap>
                <Typography.Text copyable={{ text: item.sourceUrl }} style={{ fontSize: 12 }}>
                  Source URL
                </Typography.Text>
                {item.resultUrl && (
                  <Typography.Text copyable={{ text: item.resultUrl }} style={{ fontSize: 12, marginLeft: 12 }}>
                    Result URL
                  </Typography.Text>
                )}
              </Flex>
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}
