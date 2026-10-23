/**
 * Scroll a .scroll-row sideways so `control` is fully visible, without moving
 * the page. On wide screens the row wraps and never scrolls, so this does nothing.
 */
export function revealInRow(control: Element | null) {
    const row = control?.closest<HTMLElement>(".scroll-row");
    if (!control || !row || row.scrollWidth <= row.clientWidth) return;

    // The row bleeds to the screen edge; its spacer plus one gap is the page gutter, where items should rest.
    const spacer = parseFloat(getComputedStyle(row, "::before").flexBasis) || 0;
    const gutter = spacer + (parseFloat(getComputedStyle(row).columnGap) || 0);
    const rowBox = row.getBoundingClientRect();
    const box = control.getBoundingClientRect();
    if (box.left < rowBox.left + gutter) {
        row.scrollLeft -= rowBox.left + gutter - box.left;
    } else if (box.right > rowBox.right - gutter) {
        row.scrollLeft += box.right - (rowBox.right - gutter);
    }
}
