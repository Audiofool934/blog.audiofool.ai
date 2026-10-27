import type { TimelineItemKind } from "../utils/timelineItems";

/**
 * The homepage "Selected" list, shown newest first. Each entry names a
 * timeline item by its kind and entry id; the build fails if one is missing.
 */
export const homepageSelected: { kind: TimelineItemKind; id: string }[] = [
    { kind: "log", id: "2026-10-26-prismo-on-petdex" },
    { kind: "log", id: "2026-10-26-moondog-mac-listening-room" },
    { kind: "project", id: "meric" },
    { kind: "project", id: "moondog" },
    { kind: "project", id: "mosaic" },
];
