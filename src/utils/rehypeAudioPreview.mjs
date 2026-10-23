// AudioShow batches may note a provider preview under each cover:
//
//   Audio Preview
//   https://...
//
// src/utils/parseAudioshow.ts reads that field from the Markdown source. On the
// batch page the bare URL is noise, so drop the paragraph and let the cover play
// the preview instead when it has no playback URL of its own. An episode without
// a cover keeps its paragraph, so the preview stays reachable.
//
// The page also shows each episode heading as "EP 51" and drops the "Project Links"
// label above a link list. The Markdown keeps both, because the parser reads them.
const AUDIOSHOW_DOCUMENT = /[\\/]content[\\/]audioshow[\\/]/;
// Episodes split at the same header as parseEpisodesFromMarkdown().
const EPISODE_HEADING = /📻\s*Audioshow\s*-\s*EP_(\d+)/i;
const PREVIEW_PARAGRAPH = /^(?:Audio Preview|Preview Audio)\s+(https?:\/\/\S+)$/i;
const PROJECT_LINKS_LABEL = /^Project Links$/i;
const RAW_IMG = /<img\b[^>]*>/gi;
const COVER_CLASS = /\sclass=(["'])[^"']*\baudioshow-image\b/i;
// src/scripts/audio/batch.ts plays data-audio-url or a legacy toggleMusic() handler.
const PLAYBACK = /\sdata-audio-url=|\sonclick=["']?\s*toggleMusic\(/i;

const textOf = (node) => {
  if (node.type === 'text') return node.value;
  if (node.type === 'element' && node.tagName === 'br') return '\n';
  return (node.children ?? []).map(textOf).join('');
};

const isEpisodeHeading = (node) =>
  node.type === 'element' && node.tagName === 'h3' && EPISODE_HEADING.test(textOf(node));

const previewUrl = (node) =>
  node.type === 'element' && node.tagName === 'p'
    ? textOf(node).trim().match(PREVIEW_PARAGRAPH)?.[1]
    : undefined;

const isProjectLinksLabel = (node) =>
  node.type === 'element' && node.tagName === 'p' && PROJECT_LINKS_LABEL.test(textOf(node).trim());

const escapeAttribute = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// Covers are raw HTML until Astro runs rehype-raw after the user plugins.
// Returns true when the node holds the episode cover.
const playPreviewFromCover = (node, url) => {
  if (node.type === 'raw' && typeof node.value === 'string') {
    let found = false;
    node.value = node.value.replace(RAW_IMG, (img) => {
      if (found || !COVER_CLASS.test(img)) return img;
      found = true;
      return PLAYBACK.test(img)
        ? img
        : img.replace(/<img\b/i, `<img data-audio-url="${escapeAttribute(url)}"`);
    });
    return found;
  }
  return (node.children ?? []).some((child) => playPreviewFromCover(child, url));
};

export function rehypeAudioPreview() {
  return (tree, file) => {
    if (!AUDIOSHOW_DOCUMENT.test(file?.path ?? '')) return;

    const episodes = [[]];
    for (const node of tree.children) {
      if (isEpisodeHeading(node)) episodes.push([]);
      episodes.at(-1).push(node);
    }

    // Rename headings only after the split, which matches their original text.
    // Astro derives heading ids later, so they become "ep-51".
    for (const [heading] of episodes.slice(1)) {
      const number = textOf(heading).match(EPISODE_HEADING)[1];
      heading.children = [{ type: 'text', value: `EP ${number}` }];
    }

    const removed = new Set();
    tree.children.forEach((node, index) => {
      if (!isProjectLinksLabel(node)) return;
      const next = tree.children.slice(index + 1).find((sibling) => sibling.type !== 'text');
      if (next?.type === 'element' && next.tagName === 'ul') removed.add(node);
    });
    for (const nodes of episodes) {
      const previews = nodes.filter((node) => previewUrl(node));
      if (previews.length === 0) continue;
      const url = previewUrl(previews[0]);
      if (nodes.some((node) => playPreviewFromCover(node, url))) {
        previews.forEach((node) => removed.add(node));
      }
    }
    if (removed.size > 0) {
      tree.children = tree.children.filter((node) => !removed.has(node));
    }
  };
}
