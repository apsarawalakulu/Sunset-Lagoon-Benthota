const AUTO_FILENAME_RE =
  /^(chatgpt[_\s-]?image|whatsapp[_\s-]?image|img[_\s-]?\d|pxl_|screenshot|dcim|photo[_\s-]?\d|video[_\s-]?\d)/i;

/**
 * Hide auto-generated upload filenames ("WhatsApp Image 2026…", "ChatGPT
 * Image…") behind a human label. Real custom titles pass through untouched.
 */
export function displayMediaTitle(
  title: string | null | undefined,
  category?: string | null | undefined
): string {
  const t = (title ?? "").trim();
  if (t !== "" && !AUTO_FILENAME_RE.test(t)) return t;
  const c = (category ?? "").trim();
  if (c !== "" && c.toLowerCase() !== "general") return c;
  return "River moment";
}
