import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { getPostType } from "./postType";
import githubProjects from "../data/github-projects.json";
import { getProjectState } from "./projectState";

export type TimelineItemKind = "log" | "project" | "note" | "audioshow" | "gallery";

export interface TimelineItem {
    kind: TimelineItemKind;
    lane: string;
    title: string;
    date: Date;
    href: string;
    description: string;
    sourceId: string;
    dateLabel?: string;
    // Set when the title needs its own language tag, e.g. a Chinese photo title.
    lang?: string;
}

// Lanes that hold authored writing, as opposed to project pushes, photos, music, and site changes.
const writingLanes = new Set(["post", "note"]);

const hanPattern = /\p{Script=Han}/u;

/** Log entries that appear on the timeline; redirect stubs never do. */
export function isTimelineLog(entry: CollectionEntry<"log">): boolean {
    return entry.data.timeline && !entry.data.redirectTo;
}

/** Timeline-visible log entries, newest first. */
export async function getTimelineLogs(): Promise<CollectionEntry<"log">[]> {
    const logs = await getCollection("log");
    return logs
        .filter(isTimelineLog)
        .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

function fromLog(entry: CollectionEntry<"log">): TimelineItem {
    const lane = getPostType(entry);
    return {
        kind: "log",
        lane,
        title: entry.data.title,
        date: entry.data.pubDate,
        href: `/timeline/${entry.id}/`,
        description: entry.data.description || "",
        sourceId: entry.id,
    };
}

export async function getTimelineItems(): Promise<TimelineItem[]> {
    const [logs, projects, wiki, audioshow, gallery] = await Promise.all([
        getCollection("log"),
        getCollection("projects"),
        getCollection("wiki"),
        getCollection("audioshow"),
        getCollection("gallery"),
    ]);

    const items: TimelineItem[] = [
        ...logs.filter(isTimelineLog).map(fromLog),
        ...projects.map((entry) => {
            const state = getProjectState(entry, githubProjects.projects);
            return {
                kind: "project" as const,
                lane: "project",
                title: entry.data.title,
                date: state.date,
                dateLabel: state.dateLabel,
                href: state.href,
                description: entry.data.description || "",
                sourceId: entry.id,
            };
        }),
        ...wiki.map((entry) => ({
            kind: "note" as const,
            lane: "note",
            title: entry.data.title,
            date: entry.data.updatedDate || entry.data.pubDate || new Date("2024-01-01"),
            href: `/notes/${entry.id}/`,
            description:
                entry.data.description ||
                (entry.data.tags.length ? entry.data.tags.join(" / ") : entry.data.kind),
            sourceId: entry.id,
        })),
        ...audioshow.map((entry) => ({
            kind: "audioshow" as const,
            lane: "music",
            // Every batch file shares the same authored title, so name it by its episode range.
            title: `AudioShow EP ${entry.data.episode}`,
            date: entry.data.pubDate,
            href: `/audioshow/${entry.id}/`,
            description: entry.data.description || "",
            sourceId: entry.id,
        })),
        ...gallery.map((entry) => ({
            kind: "gallery" as const,
            lane: "photo",
            title: entry.data.title,
            date: entry.data.date,
            href: `/gallery/${entry.id}/`,
            description: [entry.data.location, entry.data.camera].filter(Boolean).join(" / "),
            sourceId: entry.id,
        })),
    ];

    for (const item of items) {
        if (hanPattern.test(item.title)) item.lang = "zh";
    }

    return items.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

/** The newest posts and notes, skipping project pushes, photos, music, and site changes. */
export async function getLatestWriting(limit: number): Promise<TimelineItem[]> {
    const items = await getTimelineItems();
    return items.filter((item) => writingLanes.has(item.lane)).slice(0, limit);
}
