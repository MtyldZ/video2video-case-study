"use client";

import { App, ConfigProvider, Grid } from "antd";
import { useSyncExternalStore } from "react";
import { getTheme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeDark(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// Theme follows the OS color scheme; server render is light.
export function Providers({ children }: { children: React.ReactNode }) {
  const isDark = useSyncExternalStore(subscribeDark, () => window.matchMedia(DARK_QUERY).matches, () => false);
  const screens = Grid.useBreakpoint();
  return (
    <ConfigProvider theme={getTheme(isDark, screens.sm === false)}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
