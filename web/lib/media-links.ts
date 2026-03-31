export function extractGoogleDriveFileId(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";

  const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];

  const openMatch = trimmed.match(/[?&]id=([^&]+)/i);
  if (openMatch?.[1]) return openMatch[1];

  return "";
}

export function normalizeMediaUrl(url?: string | null) {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return "";

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/uc?export=view&id=${driveId}`;
  }

  return trimmed;
}

export function isImageLikeUrl(url?: string | null) {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) return false;

  return (
    /drive\.google\.com\/uc\?export=view/i.test(normalized) ||
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(normalized)
  );
}

export function isVideoLikeUrl(url?: string | null) {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) return false;

  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(normalized);
}
