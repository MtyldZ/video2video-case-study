"use client";

import { FileUploaderInline } from "@uploadcare/react-uploader/next";
import "@uploadcare/react-uploader/core.css";
import { Alert, Flex, Spin, Typography } from "antd";
import { useRef, useState } from "react";
import { MAX_VIDEO_BYTES, type UploadedVideo, VIDEO_MIME_TYPES } from "@/lib/schemas";

const PUBKEY = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;

interface Props {
  onUploaded: (video: UploadedVideo) => void;
}

// Uploadcare handles the browser upload; /api/upload then copies the file to Cloudinary.
export function VideoUpload({ onUploaded }: Props) {
  const [saving, setSaving] = useState<string>(); // file name being saved
  const [error, setError] = useState<string>();
  const latest = useRef<string>(undefined);

  async function save(cdnUrl: string, name: string) {
    latest.current = cdnUrl;
    setSaving(name);
    setError(undefined);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadcareUrl: cdnUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (latest.current !== cdnUrl) return; // a newer file replaced this one
      if (!res.ok) throw new Error(data.error ?? "Upload failed. Please try again.");
      onUploaded({ ...(data as UploadedVideo), name });
    } catch (e) {
      if (latest.current !== cdnUrl) return;
      setError(e instanceof TypeError ? "Network error. Check your connection and try again." : (e as Error).message);
    } finally {
      if (latest.current === cdnUrl) setSaving(undefined);
    }
  }

  if (!PUBKEY) {
    return <Alert type="error" showIcon title="Uploader is not configured (missing NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY)." />;
  }

  return (
    <Flex vertical gap={12}>
      {error && <Alert type="error" showIcon title={error} description="Remove the file below and try another one." />}
      <Spin spinning={!!saving} description={`Saving ${saving ?? ""} to secure storage…`}>
        <FileUploaderInline
          pubkey={PUBKEY}
          multiple={false}
          accept={[...VIDEO_MIME_TYPES, ".mp4", ".mov"].join(",")}
          maxLocalFileSizeBytes={MAX_VIDEO_BYTES}
          sourceList="local, url"
          onFileUploadSuccess={(file) => save(file.cdnUrl, file.name)}
          onFileRemoved={() => {
            latest.current = undefined;
            setSaving(undefined);
            setError(undefined);
          }}
        />
      </Spin>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        MP4 or MOV, up to {MAX_VIDEO_BYTES / 1024 / 1024} MB. You can also paste a direct link to a video file.
      </Typography.Text>
    </Flex>
  );
}
