import { theme as antdTheme, type ThemeConfig } from "antd";

// Tokens from the Claude Design handoff (theme.json). Fonts come from next/font CSS variables.
const FONT = "var(--font-plex), -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

const shared = {
  borderRadius: 10,
  borderRadiusLG: 14,
  borderRadiusSM: 6,
  fontFamily: FONT,
  fontFamilyCode: MONO,
  fontSize: 15,
  fontSizeSM: 13,
  fontSizeLG: 17,
  fontSizeXL: 20,
  fontSizeHeading1: 38,
  fontSizeHeading2: 30,
  fontSizeHeading3: 24,
  fontSizeHeading4: 19,
  fontSizeHeading5: 16,
  lineHeight: 1.6,
  controlHeight: 40,
  controlHeightSM: 32,
  controlHeightLG: 48,
  wireframe: false,
};

const light: ThemeConfig = {
  token: {
    ...shared,
    colorPrimary: "#C42C82",
    colorLink: "#C42C82",
    colorSuccess: "#147A50",
    colorWarning: "#A85F00",
    colorError: "#C0392B",
    colorInfo: "#2563C9",
    colorBgLayout: "#F7F5F6",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorText: "#1B1719",
    colorTextSecondary: "#5F575B",
    colorTextTertiary: "#857B80",
    colorTextQuaternary: "#ADA4A8",
    colorBorder: "#E1DADD",
    colorBorderSecondary: "#EEE9EB",
    colorFillQuaternary: "#F7F4F5",
    boxShadow: "0 1px 2px rgba(27,23,25,0.04), 0 8px 24px -14px rgba(27,23,25,0.14)",
    boxShadowSecondary: "0 6px 28px -10px rgba(27,23,25,0.18)",
  },
  components: {
    Layout: { headerBg: "#FFFFFF", headerHeight: 64, headerPadding: "0 24px", bodyBg: "#F7F5F6", footerBg: "#F7F5F6" },
    Card: { headerFontSize: 17 },
    Button: { fontWeight: 500, primaryShadow: "none", defaultShadow: "none" },
    Select: { optionSelectedBg: "#FBEBF3", optionSelectedFontWeight: 500, optionHeight: 36 },
    Slider: { railSize: 6, railBg: "#EEE9EB", trackBg: "#C42C82" },
    Tag: { defaultBg: "#F2EEF0", defaultColor: "#5F575B" },
    Segmented: { itemSelectedBg: "#FFFFFF", trackBg: "#F2EEF0" },
    Descriptions: { labelBg: "#F7F4F5" },
  },
};

const dark: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...shared,
    colorPrimary: "#E8529B",
    colorLink: "#E8529B",
    colorSuccess: "#3FBF8A",
    colorWarning: "#E0A33A",
    colorError: "#F0655A",
    colorInfo: "#6699F0",
    colorBgLayout: "#121011",
    colorBgContainer: "#1B181A",
    colorBgElevated: "#221E20",
    colorText: "#F2EEF0",
    colorTextSecondary: "#B7AEB2",
    colorTextTertiary: "#8E8489",
    colorTextQuaternary: "#6A6165",
    colorBorder: "#332E31",
    colorBorderSecondary: "#272325",
    colorFillQuaternary: "#201C1E",
    boxShadow: "0 1px 2px rgba(0,0,0,0.5), 0 10px 30px -16px rgba(0,0,0,0.7)",
    boxShadowSecondary: "0 8px 32px -12px rgba(0,0,0,0.75)",
  },
  components: {
    Layout: { headerBg: "#1B181A", headerHeight: 64, headerPadding: "0 24px", bodyBg: "#121011", footerBg: "#121011" },
    Card: { headerFontSize: 17 },
    Button: { fontWeight: 500, primaryShadow: "none", defaultShadow: "none" },
    Select: { optionSelectedBg: "#3A2430", optionSelectedFontWeight: 500, optionHeight: 36 },
    Slider: { railSize: 6, railBg: "#302B2E", trackBg: "#E8529B" },
    Tag: { defaultBg: "#2A2528", defaultColor: "#B7AEB2" },
    Segmented: { itemSelectedBg: "#332E31", trackBg: "#201C1E" },
    Descriptions: { labelBg: "#201C1E" },
  },
};

// Below `sm` every touch target clears 44px.
const mobile: ThemeConfig = {
  token: { controlHeight: 44, controlHeightLG: 50 },
  components: { Layout: { headerPadding: "0 16px" } },
};

export function getTheme(isDark: boolean, isMobile: boolean): ThemeConfig {
  // Distinct CSS-var key per variant; a shared key leaves stale colors when the OS theme flips at runtime.
  const base: ThemeConfig = {
    ...(isDark ? dark : light),
    cssVar: { key: `vv-${isDark ? "dark" : "light"}${isMobile ? "-m" : ""}` },
  };
  if (!isMobile) return base;
  return {
    ...base,
    token: { ...base.token, ...mobile.token },
    components: { ...base.components, Layout: { ...base.components?.Layout, ...mobile.components?.Layout } },
  };
}
