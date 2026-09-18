// Cloudinary delivery URLs: transformations are path segments right after `/upload/`.
const withTransform = (url: string, t: string) => url.replace("/upload/", `/upload/${t}/`);

// Auto quality: smaller files on slow/mobile connections.
export const playbackUrl = (url: string) => withTransform(url, "q_auto");
export const downloadUrl = (url: string) => withTransform(url, "fl_attachment");
// First frame as a JPEG, for lightweight previews.
export const posterUrl = (url: string) => withTransform(url, "so_0").replace(/\.\w+$/, ".jpg");

export const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
