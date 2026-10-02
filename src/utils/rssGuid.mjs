// Keep the feed identity namespace stable across the domain change.
const guidOrigin = "https://audiofool.blog";
const escapeXml = (value) => value.replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
export function stableRssGuid(href) {
  return `<guid isPermaLink="true">${escapeXml(new URL(href, guidOrigin).href)}</guid>`;
}
