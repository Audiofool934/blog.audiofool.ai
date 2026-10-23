import assert from "node:assert/strict";
import { test } from "node:test";
import { getProjectState, isExternalUrl, uniqueLabels } from "../src/utils/projectState.ts";

const project = {
    id: "meric",
    data: {
        pubDate: new Date("2026-05-13"),
        status: "research",
        pinned: true,
        url: "https://meric.audiofool.ai/",
        githubRepo: "Audiofool934/meric",
    },
};
const snapshot = {
    project: "meric",
    repo: "Audiofool934/meric",
    visibility: "public",
    syncStatus: "current",
    pushedAt: "2026-10-08T03:19:02Z",
    archived: false,
    fork: false,
};

test("project views use the public push date and keep the curated primary destination", () => {
    const state = getProjectState(project, [snapshot]);
    assert.equal(state.date.toISOString(), snapshot.pushedAt.replace("Z", ".000Z"));
    assert.equal(state.href, "https://meric.audiofool.ai/");
    assert.equal(project.data.pubDate.toISOString(), "2026-05-13T00:00:00.000Z");
});

test("missing, stale, unavailable, private, invalid, or mismatched snapshots cannot become current updates", () => {
    for (const snapshots of [
        [],
        [{ ...snapshot, syncStatus: "stale" }],
        [{ ...snapshot, syncStatus: "unavailable" }],
        [{ ...snapshot, visibility: "private" }],
        [{ ...snapshot, pushedAt: "not-a-date" }],
        [{ ...snapshot, pushedAt: "" }],
        [{ ...snapshot, repo: "Audiofool934/another-project" }],
    ]) {
        const state = getProjectState(project, snapshots);
        assert.equal(state.date, project.data.pubDate);
    }
});

test("GitHub archive and fork flags apply only to the matching current public snapshot", () => {
    const state = getProjectState(project, [{ ...snapshot, archived: true, fork: true }]);
    assert.equal(state.status, "archived");
    assert.equal(state.fork, true);
    const stale = getProjectState(project, [{ ...snapshot, archived: true, fork: true, syncStatus: "stale" }]);
    assert.equal(stale.status, "research");
    assert.equal(stale.fork, false);
});

test("unpinning keeps the archived detail route available", () => {
    assert.equal(getProjectState({ ...project, data: { ...project.data, pinned: false } }, [snapshot]).href, "/projects/meric/");
});

test("project labels print each value once, ignoring case and labels already shown", () => {
    assert.deepEqual(uniqueLabels(["Research", "research", "", undefined, "fork"]), ["Research", "fork"]);
    assert.deepEqual(uniqueLabels(["Course Project", "archived"], ["course project"]), ["archived"]);
});

test("links to another origin or to a standalone public page count as external", () => {
    const site = "https://blog.audiofool.ai";
    assert.equal(isExternalUrl("https://meric.audiofool.ai/", site), true);
    assert.equal(isExternalUrl("https://blog.audiofool.ai/projects/", site), false);
    assert.equal(isExternalUrl("/", site), false);
    assert.equal(isExternalUrl("/projects/muse/", site), false);
    // public/muse/index.html is a static poster outside the site shell.
    assert.equal(isExternalUrl("/muse/", site), true);
    assert.equal(isExternalUrl("https://blog.audiofool.ai/muse/", site), true);
});
