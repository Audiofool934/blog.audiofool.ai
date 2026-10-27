import { statSync } from "node:fs";
import path from "node:path";

interface ProjectEntry {
    id: string;
    data: {
        pubDate: Date;
        status: string;
        pinned: boolean;
        url?: string;
        githubRepo?: string;
    };
}

interface GitHubProject {
    project: string;
    repo: string;
    visibility: string;
    pushedAt: string;
    syncStatus?: string;
    archived?: boolean;
    fork?: boolean;
}

export function getProjectState(project: ProjectEntry, snapshots: GitHubProject[]) {
    const github = snapshots.find((item) =>
        item.project === project.id &&
        item.repo.toLowerCase() === project.data.githubRepo?.toLowerCase(),
    );
    const current = github?.visibility === "public" && github.syncStatus === "current";
    const pushedAt = current && github.pushedAt ? new Date(github.pushedAt) : null;
    const hasPush = pushedAt !== null && Number.isFinite(pushedAt.valueOf());

    return {
        date: hasPush ? pushedAt : project.data.pubDate,
        // A push updates the project index, not its public milestone history.
        timelineDate: project.data.pubDate,
        href: project.data.pinned && project.data.url ? project.data.url : `/projects/${project.id}/`,
        status: current && github.archived ? "archived" : project.data.status,
        fork: current && Boolean(github.fork),
    };
}

// Status, type, and category can name the same thing (status "research", type "Research"),
// so each label shows once per line; labels in `shown` are already on screen and are skipped.
export function uniqueLabels(labels: (string | undefined)[], shown: string[] = []) {
    const seen = new Set(shown.map((label) => label.toLowerCase()));
    return labels.filter((label): label is string => {
        const key = label?.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Pinned projects and project websites can point off the site. A site path also leaves the site
// when public/ serves it as a standalone file, such as the "/muse/" poster: it has no site shell,
// so opening it in the same tab stops the audio player.
export function isExternalUrl(href: string, siteOrigin?: string) {
    if (/^https?:\/\//i.test(href)) {
        const url = new URL(href);
        return url.origin !== siteOrigin || isPublicFile(url.pathname);
    }
    return href.startsWith("/") && isPublicFile(href.split(/[?#]/)[0]);
}

function isPublicFile(pathname: string) {
    const file = path.join(process.cwd(), "public", pathname, pathname.endsWith("/") ? "index.html" : "");
    return statSync(file, { throwIfNoEntry: false })?.isFile() ?? false;
}
