// Cloudinary delivery URLs: transformations are path segments right after `/upload/`.
const withTransform = (url: string, t: string) => url.replace("/upload/", `/upload/${t}/`);

// Auto quality: smaller files on slow/mobile connections.
export const playbackUrl = (url: string) => withTransform(url, "q_auto");
export const downloadUrl = (url: string) => withTransform(url, "fl_attachment");
// A frame as a JPEG, for lightweight previews (defaults to the first frame).
export const posterUrl = (url: string, atSecond = 0) => withTransform(url, `so_${atSecond}`).replace(/\.\w+$/, ".jpg");

export const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
