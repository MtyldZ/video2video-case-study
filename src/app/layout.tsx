import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Space_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppShell } from "@/components/AppShell";
import { Providers } from "./providers";
import "./globals.css";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  // Absolute base for OG/Twitter image URLs; Vercel's own URL is the fallback.
  metadataBase: new URL(
    process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  title: "Video to Video",
  description: "Restyle any clip in 75 art styles: upload a video, pick a style, get an AI-transformed version.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C42C82" },
    { media: "(prefers-color-scheme: dark)", color: "#121011" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plex.variable} ${mono.variable}`}>
      <body>
        <AntdRegistry>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
