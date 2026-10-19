import type { TimelineItemKind } from "../utils/timelineItems";

/**
 * The homepage "Selected" list, shown newest first. Each entry names a
 * timeline item by its kind and entry id; the build fails if one is missing.
 */
export const homepageSelected: { kind: TimelineItemKind; id: string }[] = [
    { kind: "log", id: "2026-08-31-how-lucky-was-this-lunar-transit" },
    { kind: "project", id: "meric" },
    { kind: "note", id: "what-makes-an-agent-agentic" },
];
