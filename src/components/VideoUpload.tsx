"use client";

import { FileUploaderRegular } from "@uploadcare/react-uploader/next";
import "@uploadcare/react-uploader/core.css";
import { Alert, Flex, Spin } from "antd";
import { useRef, useState } from "react";
import { MAX_VIDEO_BYTES, type UploadedVideo, VIDEO_MIME_TYPES } from "@/lib/schemas";

const PUBKEY = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;

interface Props {
  onChange: (video: UploadedVideo | null) => void;
}

export function VideoUpload({ onChange }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const latest = useRef<string>(undefined);

  async function save(cdnUrl: string) {
    latest.current = cdnUrl;
    setSaving(true);
    setError(undefined);
    onChange(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadcareUrl: cdnUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (latest.current !== cdnUrl) return; // a newer file replaced this one
      if (!res.ok) throw new Error(data.error ?? "Upload failed. Please try again.");
      onChange(data as UploadedVideo);
    } catch (e) {
      if (latest.current !== cdnUrl) return;
      setError(e instanceof TypeError ? "Network error. Check your connection and try again." : (e as Error).message);
    } finally {
      if (latest.current === cdnUrl) setSaving(false);
    }
  }

  function reset() {
    latest.current = undefined;
    setSaving(false);
    setError(undefined);
    onChange(null);
  }

  if (!PUBKEY) {
    return <Alert type="error" showIcon title="Uploader is not configured (missing NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY)." />;
  }

  return (
    <Flex vertical gap={12}>
      <FileUploaderRegular
        pubkey={PUBKEY}
        multiple={false}
        accept={[...VIDEO_MIME_TYPES, ".mp4", ".mov"].join(",")}
        maxLocalFileSizeBytes={MAX_VIDEO_BYTES}
        sourceList="local, url"
        onFileUploadSuccess={(file) => save(file.cdnUrl)}
        onFileRemoved={reset}
      />
      {saving && <Spin description="Saving video to secure storage…"><div style={{ height: 48 }} /></Spin>}
      {error && <Alert type="error" showIcon title={error} />}
    </Flex>
  );
}
