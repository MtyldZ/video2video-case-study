"use client";

import { Button, Card, Result } from "antd";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <Result
        status="500"
        title="Something broke on our end"
        subTitle="An unexpected error stopped the page from loading. Nothing in your history was lost."
        extra={<Button type="primary" onClick={() => retry()}>Try again</Button>}
      />
    </Card>
  );
}
