"use client";

import { Button, Card, Result } from "antd";
import Link from "next/link";

export default function NotFound() {
  return (
    <Card>
      <Result
        status="404"
        title="Page not found"
        subTitle="That link doesn't point anywhere."
        extra={[
          <Link key="create" href="/"><Button type="primary">Back to Create</Button></Link>,
          <Link key="history" href="/history"><Button>Go to History</Button></Link>,
        ]}
      />
    </Card>
  );
}
