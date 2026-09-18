"use client";

import { Alert, Button, Col, Form, Input, Radio, Row, Select, Slider, Typography } from "antd";
import { useState } from "react";
import {
  ART_STYLES,
  FPS_RESOLUTIONS,
  MODELS,
  PROMPT_TYPES,
  type TransformBody,
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

interface Props {
  source: UploadedVideo;
}

export function TransformForm({ source }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string }>();

  // Cloudinary reports duration for videos; fall back to a generous bound if missing.
  const max = Math.max(0.1, Math.floor((source.duration ?? 60) * 10) / 10);
  const range = Form.useWatch("range", form);
  const promptType = Form.useWatch(["style", "prompt_type"], form);

  async function submit(values: FormValues) {
    setSubmitting(true);
    setResult(undefined);
    const body: TransformBody = {
      source: { url: source.url, publicId: source.publicId },
      params: {
        name: values.name || undefined,
        start_seconds: values.range[0],
        end_seconds: values.range[1],
        fps_resolution: values.fps_resolution,
        style: { ...values.style, prompt: values.style.prompt_type === "default" ? undefined : values.style.prompt },
      },
    };
    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not start the transformation.");
      setResult({ type: "success", text: "Transformation started. It will appear in your history when ready." });
    } catch (e) {
      setResult({
        type: "error",
        text: e instanceof TypeError ? "Network error. Check your connection and try again." : (e as Error).message,
      });
    } finally {
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
        range: [0, Math.min(3, max)],
        fps_resolution: "HALF",
        style: { version: "default", model: "default", prompt_type: "default" },
      }}
    >
      <Form.Item
        label="Clip range"
        name="range"
        extra={
          range &&
          `${range[0].toFixed(1)}s – ${range[1].toFixed(1)}s (${(range[1] - range[0]).toFixed(1)}s). Longer clips use more credits.`
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

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Art style" name={["style", "art_style"]} rules={[{ required: true, message: "Pick an art style" }]}>
            <Select showSearch placeholder="Search styles…" options={toOptions(ART_STYLES)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Model" name={["style", "model"]}>
            <Select options={toOptions(MODELS)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Style version" name={["style", "version"]}>
            <Select options={toOptions(VERSIONS)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Frame rate"
            name="fps_resolution"
            tooltip="HALF renders every other frame: faster and cheaper."
          >
            <Radio.Group optionType="button" options={toOptions(FPS_RESOLUTIONS)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Prompt" name={["style", "prompt_type"]}>
            <Select options={PROMPT_TYPES.map((v) => ({ value: v, label: PROMPT_TYPE_LABELS[v] }))} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Name (optional)" name="name" rules={[{ max: 100 }]}>
            <Input placeholder="My transformation" />
          </Form.Item>
        </Col>
      </Row>

      {promptType && promptType !== "default" && (
        <Form.Item
          label="Prompt text"
          name={["style", "prompt"]}
          rules={[{ required: true, whitespace: true, message: "Describe the look you want" }, { max: 1000 }]}
        >
          <Input.TextArea rows={3} showCount maxLength={1000} placeholder="e.g. a watercolor city at dusk" />
        </Form.Item>
      )}

      {result && <Alert type={result.type} showIcon title={result.text} style={{ marginBottom: 16 }} />}

      <Button type="primary" htmlType="submit" loading={submitting} block size="large">
        Transform video
      </Button>
      <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
        Processing runs in the background and can take a few minutes.
      </Typography.Paragraph>
    </Form>
  );
}
