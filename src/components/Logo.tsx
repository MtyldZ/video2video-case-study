import { theme, Typography } from "antd";

export function Logo() {
  const { token } = theme.useToken();
  return (
    <Typography.Text style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, whiteSpace: "nowrap" }}>
      {/* Mark geometry from design-files assets/logo-mark.svg; colors follow the theme. */}
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2.6" y="11" width="18.4" height="18.4" rx="5.4" stroke={token.colorTextQuaternary} strokeWidth="2.6" />
        <rect x="11" y="2.6" width="18.4" height="18.4" rx="5.4" fill={token.colorPrimary} />
        <path d="M17 8.2 L24.4 11.8 L17 15.4 Z" fill="#FFFFFF" />
      </svg>
      <span>
        <strong>Video</strong>
        <span style={{ fontFamily: token.fontFamilyCode, fontSize: 13, color: token.colorTextSecondary, padding: "0 3px" }}>to</span>
        <strong>Video</strong>
      </span>
    </Typography.Text>
  );
}
