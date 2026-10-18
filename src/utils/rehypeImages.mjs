import { audioImage as audioImageVariant, audioImageSrcset, isOptimizableAudioImage, isRemoteImage } from "./audioImages.mjs";

// Astro optimizes local Markdown images (relative paths such as
// ../../assets/...) and passes these node properties on to getImage(). Without
// widths, the content layer writes srcset="". getImage drops any width above
// the source and adds the source width instead, so nothing is upscaled.
const LOCAL_IMAGE_WIDTHS = [480, 800, 1200, 1800];
// The content column: at most 56rem, beside the 16rem sidebar and 3rem gutters
// from 768px, and the viewport minus 3rem of gutters on phones.
const LOCAL_IMAGE_SIZES = '(min-width: 1248px) 56rem, (min-width: 768px) calc(100vw - 22rem), calc(100vw - 3rem)';
// Notes and timeline posts render in a single 38rem reading column, which is
// narrower (the viewport minus the sidebar and gutters) until about 960px.
const READING_COLUMN_SIZES = '(min-width: 960px) 38rem, (min-width: 768px) calc(100vw - 22rem), calc(100vw - 3rem)';
const READING_COLUMN_DOCUMENT = /[\\/]content[\\/](wiki|log)[\\/]/;
// Synced READMEs render below the project brief, so their first image never
// leads the page.
const BELOW_THE_FOLD_DOCUMENT = /[\\/]project-readmes[\\/]/;

// Inject lazy-loading + async decoding on every <img> in rendered markdown.
// Project READMEs embed full-resolution remote screenshots as raw <img>, which
// otherwise load eagerly and block paint. The first image of a document is
// usually in the first viewport, so it loads eagerly with high fetch priority.
// Only sets attributes when absent so author-specified values win.
export function rehypeImgAttrs() {
  // Raw HTML <img> in markdown (e.g. README screenshots) arrives as `raw`
  // nodes that bypass the element walk, so patch those strings too.
  const patchRawImgs = (html, isLeadImage) =>
    html.replace(/<img\b[^>]*>/gi, (img) => {
      let patched = img;
      const src = patched.match(/\ssrc=(["'])(.*?)\1/i)?.[2];
      const lead = isLeadImage();
      if (isOptimizableAudioImage(src)) {
        patched = patched.replace(/\ssrc=(["'])(.*?)\1/i, ` src="${audioImageVariant(src, 320)}"`);
        if (!/\ssrcset=/i.test(patched)) {
          patched = patched.replace(
            /<img\b/i,
            `<img srcset="${audioImageSrcset(src, [96, 320])}"`,
          );
        }
        if (!/\ssizes=/i.test(patched)) {
          patched = patched.replace(/<img\b/i, '<img sizes="(max-width: 640px) 45vw, 256px"');
        }
      }
      if (!/\sloading=/i.test(patched)) {
        patched = patched.replace(/<img\b/i, `<img loading="${lead ? 'eager' : 'lazy'}"`);
        if (lead && !/\sfetchpriority=/i.test(patched)) {
          patched = patched.replace(/<img\b/i, '<img fetchpriority="high"');
        }
      }
      if (!/\sdecoding=/i.test(patched)) {
        patched = patched.replace(/<img\b/i, '<img decoding="async"');
      }
      if (isRemoteImage(src) && !/\sreferrerpolicy=/i.test(patched)) {
        patched = patched.replace(/<img\b/i, '<img referrerpolicy="no-referrer"');
      }
      return patched;
    });
  return (tree, file) => {
    const localImagePaths = file?.data?.astro?.localImagePaths ?? [];
    const leadsPage = !BELOW_THE_FOLD_DOCUMENT.test(file?.path ?? '');
    const localImageSizes = READING_COLUMN_DOCUMENT.test(file?.path ?? '') ? READING_COLUMN_SIZES : LOCAL_IMAGE_SIZES;
    let imageCount = 0;
    const isLeadImage = () => imageCount++ === 0 && leadsPage;
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties = node.properties || {};
        const src = node.properties.src;
        const lead = isLeadImage();
        if (isOptimizableAudioImage(src)) {
          node.properties.src = audioImageVariant(src, 320);
          if (node.properties.srcset == null) {
            node.properties.srcset = audioImageSrcset(src, [96, 320]);
          }
          if (node.properties.sizes == null) {
            node.properties.sizes = '(max-width: 640px) 45vw, 256px';
          }
        }
        if (localImagePaths.length > 0 && typeof src === 'string' && localImagePaths.includes(decodeURI(src))) {
          if (node.properties.widths == null) node.properties.widths = LOCAL_IMAGE_WIDTHS;
          if (node.properties.sizes == null) node.properties.sizes = localImageSizes;
        }
        if (node.properties.loading == null) {
          node.properties.loading = lead ? 'eager' : 'lazy';
          if (lead && node.properties.fetchpriority == null) node.properties.fetchpriority = 'high';
        }
        if (node.properties.decoding == null) node.properties.decoding = 'async';
        if (isRemoteImage(src) && node.properties.referrerpolicy == null) {
          node.properties.referrerpolicy = 'no-referrer';
        }
      } else if (
        node.type === 'raw' &&
        typeof node.value === 'string' &&
        node.value.includes('<img')
      ) {
        node.value = patchRawImgs(node.value, isLeadImage);
      }
      if (node.children) node.children.forEach(walk);
    };
    walk(tree);
  };
}
