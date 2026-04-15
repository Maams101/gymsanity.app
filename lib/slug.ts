export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(name: string): string {
  const base = slugify(name) || "exercise";
  return `${base}-${Math.random().toString(36).slice(2, 10)}`;
}
