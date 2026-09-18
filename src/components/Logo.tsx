import { theme, Typography } from "antd";

export function Logo() {
  const { token } = theme.useToken();
  return (
    <Typography.Text style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, whiteSpace: "nowrap" }}>
      <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="2.4" y="9.6" width="16" height="16" rx="4.6" stroke={token.colorTextQuaternary} strokeWidth="2.2" />
        <rect x="9.6" y="2.4" width="16" height="16" rx="4.6" fill={token.colorPrimary} />
        <path d="M15 7.2 L21.4 10.4 L15 13.6 Z" fill="#FFFFFF" />
      </svg>
      <span>
        <strong>Video</strong>
        <span style={{ fontFamily: token.fontFamilyCode, fontSize: 13, color: token.colorTextSecondary, padding: "0 3px" }}>to</span>
        <strong>Video</strong>
      </span>
    </Typography.Text>
  );
}
