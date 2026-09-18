"use client";

import { Card, Flex, Typography } from "antd";
import { useState } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import type { UploadedVideo } from "@/lib/schemas";

export default function Home() {
  const [source, setSource] = useState<UploadedVideo | null>(null);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
      <Flex vertical gap={16}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Video to Video
        </Typography.Title>
        <Card title="1. Upload source video">
          <Typography.Paragraph type="secondary">MP4 or MOV, up to 100 MB.</Typography.Paragraph>
          <VideoUpload onChange={setSource} />
          {source && (
            <video src={source.url} controls playsInline style={{ width: "100%", marginTop: 16, borderRadius: 8 }} />
          )}
        </Card>
      </Flex>
    </main>
  );
}
