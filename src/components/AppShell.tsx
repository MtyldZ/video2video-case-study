"use client";

import { HistoryOutlined, MenuOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Alert, Button, Drawer, Flex, Grid, Layout, Menu, Segmented, theme, Typography } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/Logo";

const NAV = [
  { key: "/", label: "Create", icon: <ThunderboltOutlined /> },
  { key: "/history", label: "History", icon: <HistoryOutlined /> },
];

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();
  const isMobile = Grid.useBreakpoint().sm === false;
  const [menuOpen, setMenuOpen] = useState(false);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const current = NAV.some((n) => n.key === pathname) ? pathname : "";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Link href="/" aria-label="Video to Video home">
          <Logo />
        </Link>
        <div style={{ flex: 1 }} />
        {isMobile ? (
          <Button type="text" size="large" icon={<MenuOutlined />} aria-label="Open navigation" onClick={() => setMenuOpen(true)} />
        ) : (
          <Segmented
            value={current}
            options={NAV.map((n) => ({ value: n.key, label: n.label, icon: n.icon }))}
            onChange={(v) => router.push(v)}
          />
        )}
      </Layout.Header>

      <Layout.Content style={{ padding: isMobile ? "20px 16px 32px" : "36px 32px 56px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {!online && (
            <Alert
              type="warning"
              showIcon
              title="You're offline. Uploads and updates will fail until the connection is back."
              style={{ marginBottom: 16 }}
            />
          )}
          {children}
        </div>
      </Layout.Content>

      <Layout.Footer style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Flex justify="center">
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Powered by{" "}
            <Typography.Link href="https://magichour.ai" target="_blank" rel="noreferrer">
              Magic Hour
            </Typography.Link>
          </Typography.Text>
        </Flex>
      </Layout.Footer>

      <Drawer title="Menu" placement="right" size={280} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Menu
          mode="vertical"
          selectedKeys={[current]}
          style={{ border: 0 }}
          items={NAV.map((n) => ({ key: n.key, icon: n.icon, label: n.label }))}
          onClick={({ key }) => {
            setMenuOpen(false);
            router.push(key);
          }}
        />
      </Drawer>
    </Layout>
  );
}
