"use client";

import { ThunderboltOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Descriptions, Form, Grid, Input, Radio, Row, Select, Slider, theme, Typography } from "antd";
import { useState } from "react";
import { notifyCreditsChanged, useCredits } from "@/components/useCredits";
import { startTransform } from "@/lib/api";
import {
  ART_STYLES,
  estimateCredits,
  FPS_RESOLUTIONS,
  MAX_CLIP_SECONDS,
  MODELS,
  PROMPT_TYPES,
  type TransformParams,
  type UploadedVideo,
  VERSIONS,
} from "@/lib/schemas";

type FormValues = Pick<TransformParams, "name" | "fps_resolution" | "style"> & { range: [number, number] };

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));
const PROMPT_TYPE_LABELS: Record<(typeof PROMPT_TYPES)[number], string> = {
  default: "Style default",
  custom: "Custom prompt",
  append_default: "Style default + my prompt",
};
const round1 = (n: number) => Math.round(n * 10) / 10;

// Keeps the range within MAX_CLIP_SECONDS by dragging the other handle along.
function capRange(value: [number, number], prev?: [number, number]): [number, number] {
  const [start, end] = value;
  if (end - start <= MAX_CLIP_SECONDS) return value;
  return prev && start !== prev[0] ? [start, round1(start + MAX_CLIP_SECONDS)] : [round1(end - MAX_CLIP_SECONDS), end];
}

interface Props {
  source: UploadedVideo;
  initial?: TransformParams;
  onSubmitted: (id: string, params: TransformParams) => void;
}

export function TransformForm({ source, initial, onSubmitted }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const isMobile = Grid.useBreakpoint().sm === false;
  const { token } = theme.useToken();

  // Cloudinary reports duration for videos; fall back to a generous bound if missing.
  const max = Math.max(0.1, Math.floor((source.duration ?? 60) * 10) / 10);
  const values = Form.useWatch([], form);
  const range = values?.range;
  const promptType = values?.style?.prompt_type;
  const credits = useCredits();
  const estimate = range ? estimateCredits(range[1] - range[0], values?.fps_resolution ?? "HALF", source.frameRate) : undefined;
  const overBudget = credits != null && estimate != null && estimate > credits;

  async function submit(v: FormValues) {
    setSubmitting(true);
    setError(undefined);
    const params: TransformParams = {
      name: v.name || undefined,
      start_seconds: v.range[0],
      end_seconds: v.range[1],
      fps_resolution: v.fps_resolution,
      style: { ...v.style, prompt: v.style.prompt_type === "default" ? undefined : v.style.prompt },
    };
    try {
      const { id } = await startTransform({ source: { url: source.url, publicId: source.publicId }, params });
      notifyCreditsChanged();
      onSubmitted(id, params);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      onFinish={submit}
      disabled={submitting}
      initialValues={{
        range: initial ? [initial.start_seconds, initial.end_seconds] : [0, Math.min(3, max)],
        fps_resolution: initial?.fps_resolution ?? "HALF",
        name: initial?.name,
        style: initial?.style ?? { version: "default", model: "default", prompt_type: "default" },
      }}
    >
      {error && <Alert type="error" showIcon title="Could not start the render" description={error} style={{ marginBottom: 20 }} />}

      <Form.Item
        label="Clip range"
        name="range"
        tooltip="Only the selected range is transformed."
        normalize={capRange}
        extra={
          <>
            {range && (
              <Typography.Text code>
                {range[0]}–{range[1]}s · {round1(range[1] - range[0])}s selected
              </Typography.Text>
            )}{" "}
            Up to {MAX_CLIP_SECONDS}s per render. Longer clips and FULL frame rate use more credits.
          </>
        }
        rules={[
          {
            validator: (_, v?: [number, number]) =>
              v && v[1] > v[0] ? Promise.resolve() : Promise.reject(new Error("End must be after start")),
          },
        ]}
      >
        <Slider range min={0} max={max} step={0.1} tooltip={{ formatter: (v) => `${v}s` }} />
      </Form.Item>

      <Row gutter={[24, 0]}>
        <Col xs={24} md={12}>
          <Form.Item label="Art style" name={["style", "art_style"]} rules={[{ required: true, message: "Pick an art style to continue." }]}>
            <Select showSearch placeholder={`Search ${ART_STYLES.length} styles`} options={toOptions(ART_STYLES)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Model" name={["style", "model"]} extra="Leave on default unless you want a specific look.">
            <Select options={toOptions(MODELS)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Style version" name={["style", "version"]}>
            <Select options={toOptions(VERSIONS)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Frame rate" name="fps_resolution" tooltip="HALF renders every other frame: faster and cheaper.">
            <Radio.Group optionType="button" buttonStyle="solid" options={toOptions(FPS_RESOLUTIONS)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Prompt type" name={["style", "prompt_type"]}>
            <Select options={PROMPT_TYPES.map((v) => ({ value: v, label: PROMPT_TYPE_LABELS[v] }))} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Name" name="name" extra="Optional, shown in History." rules={[{ max: 100 }]}>
            <Input placeholder={source.name ?? "My transformation"} maxLength={100} />
          </Form.Item>
        </Col>
      </Row>

      {promptType && promptType !== "default" && (
        <Form.Item
          label="Prompt"
          name={["style", "prompt"]}
          rules={[{ required: true, whitespace: true, message: "A prompt is required for this prompt type." }, { max: 1000 }]}
        >
          <Input.TextArea rows={4} showCount maxLength={1000} placeholder="neon-lit street at night, rain, cinematic" />
        </Form.Item>
      )}

      {range && (
        <Descriptions
          size="small"
          bordered
          column={isMobile ? 1 : 2}
          title="Render summary"
          style={{ marginBottom: 20 }}
          items={[
            { key: "clip", label: "Clip", children: `${range[0]}–${range[1]}s · ${round1(range[1] - range[0])}s` },
            { key: "style", label: "Style", children: `${values?.style?.art_style ?? "—"} · ${values?.style?.version}` },
            { key: "model", label: "Model", children: values?.style?.model },
            { key: "fps", label: "Frame rate", children: values?.fps_resolution },
            { key: "prompt", label: "Prompt", children: promptType && PROMPT_TYPE_LABELS[promptType] },
            {
              key: "cost",
              label: "Estimated cost",
              children: (
                <Typography.Text strong type={overBudget ? "danger" : undefined}>
                  ≈ {estimate} credits{credits != null && <Typography.Text type="secondary"> · {credits} left</Typography.Text>}
                </Typography.Text>
              ),
            },
          ]}
        />
      )}

      <div
        style={
          isMobile
            ? { position: "sticky", bottom: 0, background: token.colorBgContainer, padding: "12px 0 4px", zIndex: 10 }
            : { maxWidth: 420 }
        }
      >
        {overBudget && (
          <Alert
            type="warning"
            showIcon
            title="Not enough credits for this render"
            description={values?.fps_resolution === "FULL" ? "Shorten the clip or switch to HALF frame rate." : "Shorten the clip."}
            style={{ marginBottom: 12 }}
          />
        )}
        <Button type="primary" htmlType="submit" size="large" block loading={submitting} disabled={overBudget} icon={<ThunderboltOutlined />}>
          {submitting ? "Queueing render…" : "Transform video"}
        </Button>
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, textAlign: "center", margin: "8px 0 0" }}>
          About 2 credits per rendered frame. The final charge is confirmed when the job completes.
        </Typography.Paragraph>
      </div>
    </Form>
  );
}
