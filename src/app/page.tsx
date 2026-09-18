"use client";

import { ArrowRightOutlined, CheckCircleOutlined, SwapOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Grid, Row, Steps, Tag, Typography } from "antd";
import { useState } from "react";
import { JobStatus } from "@/components/JobStatus";
import { TransformForm } from "@/components/TransformForm";
import { VideoUpload } from "@/components/VideoUpload";
import { formatBytes, posterUrl } from "@/lib/media";
import type { TransformParams, UploadedVideo } from "@/lib/schemas";

type Step = 0 | 1 | 2;

function UploadedSummary({ video, onReplace, onContinue }: { video: UploadedVideo; onReplace: () => void; onContinue: () => void }) {
  const meta = [
    video.duration != null && `${Math.round(video.duration)}s`,
    video.width && video.height && `${video.width}×${video.height}`,
    video.bytes && formatBytes(video.bytes),
  ].filter(Boolean);
  const portrait = !!video.width && !!video.height && video.height > video.width;
  return (
    <Row gutter={[20, 16]}>
      <Col xs={24} md={portrait ? 8 : 14}>
        <video src={video.url} poster={posterUrl(video.url)} controls playsInline style={{ width: "100%", borderRadius: 10, background: "#000", display: "block" }} />
      </Col>
      <Col xs={24} md={portrait ? 16 : 10}>
        <Flex vertical gap={12} style={{ height: "100%" }}>
          <Flex vertical gap={4}>
            <Flex gap={8} align="center">
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Ready
              </Tag>
              <Typography.Text type="secondary" code>
                {meta.join(" · ")}
              </Typography.Text>
            </Flex>
            {video.name && <Typography.Text strong style={{ wordBreak: "break-all" }}>{video.name}</Typography.Text>}
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Stored securely
            </Typography.Text>
          </Flex>
          <Flex gap={8} wrap style={{ marginTop: "auto" }}>
            <Button icon={<SwapOutlined />} onClick={onReplace}>
              Replace video
            </Button>
            <Button type="primary" icon={<ArrowRightOutlined />} iconPlacement="end" onClick={onContinue}>
              Continue
            </Button>
          </Flex>
        </Flex>
      </Col>
    </Row>
  );
}

export default function CreatePage() {
  const isMobile = Grid.useBreakpoint().sm === false;
  const [step, setStep] = useState<Step>(0);
  const [source, setSource] = useState<UploadedVideo | null>(null);
  const [params, setParams] = useState<TransformParams>();
  const [jobId, setJobId] = useState<string>();

  const startOver = () => {
    setSource(null);
    setParams(undefined);
    setJobId(undefined);
    setStep(0);
  };

  return (
    <Flex vertical gap={24}>
      <div>
        <Typography.Title level={isMobile ? 3 : 2} style={{ margin: "0 0 6px" }}>
          Restyle a video
        </Typography.Title>
        <Typography.Text type="secondary">
          Upload a short clip, pick an art style, and we render a transformed version. Most jobs finish in a few minutes.
        </Typography.Text>
      </div>

      <Steps
        current={step}
        size="small"
        responsive={false}
        items={[
          { title: "Upload", content: isMobile ? undefined : "MP4 or MOV" },
          { title: "Configure", content: isMobile ? undefined : "Style and range" },
          { title: "Processing", content: isMobile ? undefined : "A few minutes" },
        ]}
      />

      {step === 0 && (
        <Card title="1 · Upload video">
          {source ? (
            <UploadedSummary video={source} onReplace={() => setSource(null)} onContinue={() => setStep(1)} />
          ) : (
            <VideoUpload onUploaded={setSource} />
          )}
        </Card>
      )}

      {step === 1 && source && (
        <Card title="2 · Configure" extra={<Button type="link" onClick={() => setStep(0)}>Change video</Button>}>
          <TransformForm
            source={source}
            initial={params}
            onSubmitted={(id, p) => {
              setJobId(id);
              setParams(p);
              setStep(2);
            }}
          />
        </Card>
      )}

      {step === 2 && jobId && (
        <Card>
          <JobStatus
            key={jobId}
            jobId={jobId}
            onRetried={setJobId}
            onChangeSettings={() => setStep(1)}
            onNew={startOver}
          />
        </Card>
      )}
    </Flex>
  );
}

