# Design prompt

Prompt used with Claude Design to generate the UI kit, screens and image assets for this app.

```text
Design a complete UI kit and screen set for a responsive web app called "Video to Video" (working name — propose a better short product name and wordmark if you like). It is an AI tool: the user uploads a short video, picks a visual style (e.g. Anime, Pixar, Watercolor, Cyberpunk), and receives an AI-transformed version of the video a few minutes later. Tone: clean, modern, creative-tool feel, trustworthy, not playful-childish. Light theme primary; provide a dark variant too.

HARD CONSTRAINT — ANT DESIGN v6
The app is built with Ant Design (antd) v6 components only, themed via ConfigProvider design tokens. Every element you design must map to a real antd component (Layout, Card, Steps, Form, Select, Slider, Radio.Group (button style), Input, Input.TextArea, Button, Alert, Result, Empty, Skeleton, Spin, Progress, Tag, Badge, List, Table, Descriptions, Drawer, Modal, Tooltip, Popconfirm, Segmented, Typography, Grid Row/Col, Flex, Image, Dropdown, message/notification). Do not invent custom widgets that antd can't reproduce with tokens + light CSS. For every screen, annotate which antd component each element is.

DELIVERABLES
1. Design tokens as an antd ConfigProvider theme object (JSON): colorPrimary, colorSuccess, colorWarning, colorError, colorInfo, colorBgLayout, colorBgContainer, colorText/Secondary, borderRadius (+LG/SM), fontFamily (Google Font or system stack), fontSize scale, controlHeight, boxShadow, plus component-level overrides (Card, Button, Steps, Select, Slider, Tag) where needed. Light and dark (antd darkAlgorithm) versions. All text/background pairs must meet WCAG AA.
2. Spacing & layout: 8px grid, max content width (~960–1120px), antd breakpoints (xs <576, sm ≥576, md ≥768, lg ≥992, xl ≥1200, xxl ≥1600).
3. Every screen below in three frames: Mobile 375px, Tablet 768px, Desktop 1440px.
4. A component sheet showing all states (default, hover, focus, disabled, loading, error) for the key components.

SCREENS & STATES
A. App shell
   - Header: logo + wordmark, nav to "Create" and "History"; on mobile a compact header (hamburger/Drawer or bottom Segmented tabs — pick the better one and justify it).
   - Footer: minimal (powered by Magic Hour, links).
B. Create flow (single page, antd Steps: 1 Upload → 2 Configure → 3 Processing)
   1. Upload step (Uploadcare widget embedded inside an antd Card; design the surrounding card and a drop-zone look that matches):
      - Empty state with drag-and-drop area, "MP4 or MOV, up to 100 MB" hint, "or paste a link" option.
      - Uploading (Progress bar with %, file name, size, cancel).
      - "Saving to secure storage…" (Spin).
      - Success: inline video preview player with duration, file name, "Replace video" action.
      - Errors (Alert): unsupported format, file too large, invalid/unreachable URL, network error, storage failure — each with a clear recovery action.
   2. Configure step (antd Form, vertical layout; 2 columns desktop, 1 column mobile):
      - Clip range: range Slider over the video timeline showing start/end/length in seconds, with helper text "Longer clips use more credits". Optionally a filmstrip/thumbnail strip behind the slider.
      - Art style: searchable Select with 75 styles. ALSO design an optional visual style picker (grid of style thumbnail cards with names, selectable, with search + category Segmented filter: Anime, Games, Art, Sci-Fi, Characters, Other) that opens in a Drawer on mobile / Modal on desktop.
      - Model (Select: default, Dreamshaper, Absolute Reality, Flat 2D Anime, Soft Anime, Kaywaii, Western Anime, 3D Anime).
      - Style version (Select: default, v1, v2).
      - Frame rate (Radio.Group buttons: HALF / FULL, with Tooltip "HALF is faster and cheaper").
      - Prompt type (Select: Style default / Custom prompt / Style default + my prompt); when not default, a TextArea with character count (max 1000) appears.
      - Optional name (Input).
      - Primary full-width "Transform video" Button; loading state; validation error states on fields.
      - Submit errors (Alert): not enough credits (with upsell/explanation), invalid parameters, rate limited ("try again in a moment"), service unavailable.
   3. Processing step:
      - Friendly waiting state: animated processing illustration, status text (Queued → Rendering → Finalizing), estimated time, "You can leave this page — it will appear in History" message, link to History.
      - Complete: before/after comparison (side-by-side on desktop, stacked or swipe-toggle on mobile) with Download, Copy link, "Transform another" actions.
      - Failed and Timed-out variants (antd Result) with Retry.
C. History page
   - Desktop: List or Table of past transformations; mobile: stacked Cards.
   - Each item: source video thumbnail, result thumbnail (or placeholder while processing), name, art style, key params (clip range, fps, model, prompt type), created time (relative), status Tag with icon: Pending (default), Processing (blue, spinning), Complete (green), Failed (red), Timed out (orange).
   - Item actions: play/compare, download result, copy source URL, copy result URL, retry (failed/timed-out).
   - Detail view: Drawer (mobile bottom sheet style / desktop right drawer) with Descriptions of all parameters, both videos, URLs with copy buttons, error message if failed.
   - States: loading Skeleton list, Empty (with illustration + "Create your first transformation" CTA), fetch error with retry, auto-refresh indicator while items are processing, pagination or "Load more".
D. System pages: 404, generic error (500) boundary, offline banner.

IMAGES & ILLUSTRATIONS TO PRODUCE (export SVG where possible, PNG @1x/@2x otherwise)
- Logo: icon mark + horizontal wordmark + stacked version; light and dark variants; monochrome version.
- Favicon and app icons: favicon.svg, favicon.ico (16/32/48), apple-touch-icon 180×180, PWA icons 192×192 and 512×512 (plus maskable).
- Open Graph / social share image 1200×630 and Twitter card 1200×600.
- Empty-state illustrations (consistent style, work in light & dark): no video uploaded, no history yet, generic error, transformation failed, timed out, not enough credits, offline, 404.
- Processing animation (SVG/Lottie-friendly frames): e.g. a frame morphing from "real" to "stylized".
- Video poster/placeholder image for items still processing (16:9 and 9:16).
- Upload drop-zone illustration/icon.
- Before/after hero illustration for the Create page header (optional).
- Style thumbnails: a template for style preview cards plus ~12 sample thumbnails for representative styles (Anime, Pixar, Watercolor, Cyberpunk, Lego, Minecraft, Oil Painting, Van Gogh, Pixel, Comic, Clay, Studio Ghibli), same subject in each so they're comparable.
- Icon set: use @ant-design/icons only; list which icon is used where.

RESPONSIVE & ACCESSIBILITY RULES
- Mobile first; no horizontal scroll at 375px; touch targets ≥ 44px; primary action reachable with the thumb (sticky bottom button on mobile for Configure step is acceptable).
- Visible focus states, labels on every form field, status never conveyed by color alone (icon + text on Tags), reduced-motion alternative for animations.
- Video players: 16:9 and 9:16 (portrait phone videos) both must look good.

OUTPUT FORMAT
Screens as frames grouped by page and breakpoint, the component sheet, the token JSON, an asset export list with file names and sizes, and a short rationale for key decisions (navigation pattern on mobile, style picker, before/after comparison).
```
