import type { CollectionEntry } from "astro:content";

/**
 * Classify a log entry into a timeline lane from its tags (case-insensitive).
 * Other collections take their lane from the source collection in
 * timelineItems.ts, so the Notes lane holds only wiki notes and authored
 * log writing lands in "post".
 *
 * First match wins: "meta" or "update" -> site, "gallery" -> photo,
 * "audioshow" -> music, "project" or "projects" -> project, else post.
 */
export function getPostType(post: CollectionEntry<"log">): string {
    const tags = post.data.tags.map((tag) => tag.toLowerCase());
    if (tags.includes("meta") || tags.includes("update")) return "site";
    if (tags.includes("gallery")) return "photo";
    if (tags.includes("audioshow")) return "music";
    if (tags.includes("project") || tags.includes("projects")) return "project";
    return "post";
}
