"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Flex, Tag, theme, Typography } from "antd";
import { useEffect, useRef } from "react";
import { playbackUrl, posterUrl } from "@/lib/media";
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
  /** Limit playback to this part of the video, so a source can be compared with the rendered clip. */
  range?: { start: number; end: number };
  caption?: string;
}

// Video with a Cloudinary poster frame; shows a placeholder when there is no URL yet.
export function VideoPlayer({ url, label, placeholder = "No result yet", range, caption }: VideoPlayerProps) {
  const { token } = theme.useToken();
  const ref = useRef<HTMLVideoElement>(null);
  const start = range?.start ?? 0;
  const end = range?.end;

  // Seek to the start of the range, also when the range changes while dragging the slider.
  useEffect(() => {
    const video = ref.current;
    if (!video || !range) return;
    const seek = () => {
      video.currentTime = start;
    };
    if (video.readyState > 0) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });
  }, [range, start, end]);

  // Loop at the end of the range. `timeupdate` only fires ~4x/s, which overshoots a short clip by
  // up to 0.25s; a timer keeps it tight (and unlike requestAnimationFrame it still runs in a
  // background tab, where playback would otherwise run past the end).
  useEffect(() => {
    const video = ref.current;
    if (!video || end == null) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => clearInterval(timer);
    const play = () => {
      stop();
      timer = setInterval(() => {
        if (video.currentTime >= end) video.currentTime = start;
      }, 60);
    };
    video.addEventListener("play", play);
    video.addEventListener("pause", stop);
    if (!video.paused) play();
    return () => {
      stop();
      video.removeEventListener("play", play);
      video.removeEventListener("pause", stop);
    };
  }, [start, end]);

  // Scrubbing before the range snaps back to its start.
  const onTimeUpdate = () => {
    const video = ref.current;
    if (!video || end == null) return;
    if (video.currentTime < start - 0.25) video.currentTime = Math.min(start, video.duration || start);
  };

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
          ref={ref}
          // A ranged player must seek, so it streams the original: while Cloudinary derives a
          // transformed copy it reports a partial duration and seeking fails.
          src={range ? url : playbackUrl(url)}
          poster={posterUrl(url, Math.floor(start))}
          controls
          playsInline
          preload={range ? "metadata" : "none"}
          onTimeUpdate={onTimeUpdate}
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
