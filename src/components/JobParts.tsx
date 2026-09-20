"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Flex, Tag, theme, Typography } from "antd";
import { clipUrl, playbackUrl, posterUrl } from "@/lib/media";
import type { HistoryItem, TransformStatus } from "@/lib/schemas";

const STATUS: Record<TransformStatus, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: "default", label: "Pending", icon: <ClockCircleOutlined /> },
  processing: { color: "processing", label: "Processing", icon: <SyncOutlined spin /> },
  complete: { color: "success", label: "Complete", icon: <CheckCircleOutlined /> },
  failed: { color: "error", label: "Failed", icon: <CloseCircleOutlined /> },
  timed_out: { color: "warning", label: "Timed out", icon: <ExclamationCircleOutlined /> },
};

export const isActive = (s: TransformStatus) => s === "pending" || s === "processing";

export function StatusTag({ status }: { status: TransformStatus }) {
  const s = STATUS[status];
  return (
    <Tag color={s.color} icon={s.icon} style={{ marginInlineEnd: 0 }}>
      {s.label}
    </Tag>
  );
}

export const jobTitle = (item: HistoryItem) => item.params.name || item.params.style.art_style;

export function describeParams(item: HistoryItem) {
  const p = item.params;
  const parts = [
    p.style.art_style,
    `${p.start_seconds}–${p.end_seconds}s`,
    p.fps_resolution,
    `model ${p.style.model}`,
    `v ${p.style.version}`,
  ];
  if (item.creditsCharged != null) parts.push(`${item.creditsCharged} credits`);
  return parts.join(" · ");
}

interface VideoPlayerProps {
  url?: string;
  label?: string;
  placeholder?: string;
  /** Show only this part of the video (trimmed by Cloudinary), so a source matches the rendered clip. */
  range?: { start: number; end: number };
  caption?: string;
}

// Video with a Cloudinary poster frame; shows a placeholder when there is no URL yet.
export function VideoPlayer({ url, label, placeholder = "No result yet", range, caption }: VideoPlayerProps) {
  const { token } = theme.useToken();
  const src = range ? clipUrl(url ?? "", range.start, range.end) : url && playbackUrl(url);

  const box: React.CSSProperties = { width: "100%", aspectRatio: "16 / 9", borderRadius: token.borderRadius };
  return (
    <Flex vertical gap={6} style={{ minWidth: 0 }}>
      {label && (
        <Typography.Text type="secondary" style={{ fontFamily: token.fontFamilyCode, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>
          {label}
        </Typography.Text>
      )}
      {url ? (
        <video
          src={src}
          poster={posterUrl(url, Math.floor(range?.start ?? 0))}
          controls
          playsInline
          preload="none"
          style={{ ...box, display: "block", background: "#000", objectFit: "contain" }}
        />
      ) : (
        <Flex
          align="center"
          justify="center"
          style={{
            ...box,
            background: `repeating-linear-gradient(135deg, ${token.colorFillQuaternary} 0 7px, ${token.colorFillTertiary} 7px 14px)`,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Typography.Text type="secondary" style={{ fontFamily: token.fontFamilyCode, fontSize: 12 }}>
            {placeholder}
          </Typography.Text>
        </Flex>
      )}
      {caption && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {caption}
        </Typography.Text>
      )}
    </Flex>
  );
}
