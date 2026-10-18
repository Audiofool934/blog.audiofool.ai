// Keep a number and its unit on one line ("400 mm", "1.14 s") by turning the
// space between them into a no-break space. The unit must end at a word
// boundary, so "3 models" and "2 my" are left alone.
const NUMBER_UNIT_SPACE =
  /(?<=\d) (?=(?:km\/h|m\/s|kHz|MHz|GHz|min|fps|mph|mm|cm|km|ms|px|Hz|kB|MB|GB|TB|dB|m|s|h|°)(?![\p{L}\p{N}_]))/gu;

// Code and math keep their exact text. Headings are skipped too: Astro derives
// their anchor ids from the text, and a no-break space would change the slug.
const SKIPPED_TAGS = new Set([
  'code', 'pre', 'kbd', 'samp', 'script', 'style', 'math', 'svg',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);
const SKIPPED_CLASSES = ['katex', 'katex-display', 'katex-error'];

export function rehypeUnitSpaces() {
  const isSkipped = (node) => {
    const className = node.properties?.className;
    return SKIPPED_TAGS.has(node.tagName) ||
      (Array.isArray(className) && className.some((name) => SKIPPED_CLASSES.includes(name)));
  };
  const walk = (node) => {
    if (node.type === 'text') {
      node.value = node.value.replace(NUMBER_UNIT_SPACE, ' ');
      return;
    }
    if (node.type === 'element' && isSkipped(node)) return;
    if (node.children) node.children.forEach(walk);
  };
  return (tree) => {
    walk(tree);
  };
}
