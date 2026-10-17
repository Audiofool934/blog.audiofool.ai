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
        dateLabel: hasPush ? "GitHub push" : "Published",
        href: project.data.pinned && project.data.url ? project.data.url : `/projects/${project.id}/`,
        status: current && github.archived ? "archived" : project.data.status,
        fork: current && Boolean(github.fork),
    };
}
