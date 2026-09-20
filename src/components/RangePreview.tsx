"use client";

import { theme, Typography } from "antd";
import { useEffect, useRef } from "react";
import { posterUrl } from "@/lib/media";

interface Props {
  url: string;
  start: number;
  end: number;
}

// Plays only the selected part of the source video: the same frames the render will use.
// Clamping the player is instant and free; a trimmed Cloudinary copy would cost a transformation per drag.
export function RangePreview({ url, start, end }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  // Jump to the new start whenever the range changes.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const seek = () => {
      video.currentTime = start;
    };
    if (video.readyState > 0) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });
  }, [start, end]);

  // Keep playback inside the range; loop back to the start at the end.
  // Re-created each render, so it always sees the current range.
  const onTimeUpdate = () => {
    const video = ref.current;
    if (!video) return;
    if (video.currentTime >= end || video.currentTime < start - 0.25) video.currentTime = Math.min(start, video.duration || start);
  };

  const { token } = theme.useToken();
  return (
    <div>
      <video
        ref={ref}
        // The original, not q_auto: while Cloudinary derives a transformed copy it reports a partial
        // duration, which breaks seeking into the selected range.
        src={url}
        poster={posterUrl(url)}
        controls
        playsInline
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        style={{ width: "100%", maxHeight: 320, borderRadius: token.borderRadius, background: "#000", display: "block" }}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Preview of the selected range. Playback loops between {start}s and {end}s.
      </Typography.Text>
    </div>
  );
}
