// rehype-katex renders a formula that KaTeX cannot parse as a red
// <span class="katex-error"> and only records a file message, which the build
// never prints. Register this right after rehypeKatex to print each broken
// formula during the build. It must not throw: Astro's content loader catches
// render errors and stores an empty body, so a throw would ship a blank article.
// The katex-error span stays in the output, and check:routes fails on it.
export function rehypeKatexErrors() {
  const textContent = (node) =>
    node.type === 'text' ? node.value : (node.children || []).map(textContent).join('');
  return (tree, file) => {
    const walk = (node) => {
      const className = node.properties?.className;
      if (node.type === 'element' && Array.isArray(className) && className.includes('katex-error')) {
        console.error(
          `[katex] Could not render a formula in ${file?.path ?? 'a Markdown file'}\n` +
          `  ${node.properties.title ?? 'Unknown KaTeX error'}\n` +
          `  Formula: ${textContent(node)}`,
        );
      }
      if (node.children) node.children.forEach(walk);
    };
    walk(tree);
  };
}
