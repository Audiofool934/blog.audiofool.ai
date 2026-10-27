import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import * as approval from "../scripts/approve-timeline.mjs";

const { draftToMarkdown } = approval;

const repo = "Audiofool934/moondog";
const source = `https://github.com/${repo}/commit/${"a".repeat(40)}`;
const draft = {
    id: "2026-10-20-moondog-for-mac",
    project: "moondog",
    title: "Moondog for Mac",
    date: "2026-10-20T18:51:56Z",
    description: "A Mac window on the same core as the terminal.",
    body: "Moondog now has a Mac window that shares its core with the terminal.",
    sources: [source],
};

export { draft, repo, source };

test("approved drafts become normal project-lane logs with traceable GitHub sources", () => {
    const markdown = draftToMarkdown(draft, repo);
    assert(markdown.startsWith('---\ntitle: "Moondog for Mac"\n'));
    assert(markdown.includes('tags: ["Projects"]'));
    assert(markdown.includes(`githubActivity: ${JSON.stringify([source])}`));
    assert(markdown.includes("\n\n" + draft.body + "\n"));
    assert(!markdown.includes('"Update"'));
});

test("approval rejects unsafe IDs, missing prose, invalid dates, and unrelated source URLs", () => {
    for (const change of [
        { id: "../escape" },
        { project: "../escape" },
        { id: "2026-10-19-wrong-date" },
        { title: " " },
        { title: "one\ntwo" },
        { date: "tomorrow" },
        { date: "2026-02-30T00:00:00Z" },
        { description: "" },
        { body: " " },
        { sources: [] },
        { sources: ["https://github.com/another/repo/pull/1"] },
        { sources: ["https://github.com/Audiofool934/moondog/blob/main/README.md"] },
        { sources: [source + "?redirect=evil"] },
    ]) assert.throws(() => draftToMarkdown({ ...draft, ...change }, repo));
    assert.throws(() => draftToMarkdown(draft, "Audiofool934/moondog/extra"));
    assert.throws(() => draftToMarkdown({ ...draft, sources: ["https://github.com/Owner/repo.git/pull/1"] }, "Owner/repo.git"));
});

test("approval checks public evidence and writes once without overwriting or reposting", async () => {
    const scratch = path.resolve(".local");
    await mkdir(scratch, { recursive: true });
    const root = await mkdtemp(path.join(scratch, "timeline-approval-"));
    try {
        await mkdir(path.join(root, "src/content/projects"), { recursive: true });
        await mkdir(path.join(root, "src/content/log"), { recursive: true });
        await writeFile(path.join(root, "src/content/projects/moondog.md"), `---\ngithubRepo: '${repo}'\n---\n`);
        const calls = [];
        const api = async (endpoint) => {
            calls.push(endpoint);
            return endpoint === `repos/${repo}`
                ? { private: false, fork: false, archived: false, full_name: repo, default_branch: "main" }
                : { sha: "a".repeat(40), html_url: source };
        };
        const target = await approval.approveDraft(draft, { root, api });
        assert.equal(target, path.join(root, "src/content/log", draft.id + ".md"));
        assert.deepEqual(calls, [`repos/${repo}`, `repos/${repo}/commits/${"a".repeat(40)}`]);
        assert.equal(await readFile(target, "utf8"), draftToMarkdown(draft, repo));
        await assert.rejects(approval.approveDraft(draft, { root, api }));
        await assert.rejects(approval.approveDraft({ ...draft, id: "2026-10-20-another-title" }, { root, api }), /already approved/);
        assert.equal((await readdir(path.dirname(target))).length, 1);
        for (const metadata of [
            { private: true },
            { private: false, archived: true },
            { private: false, fork: true },
            { private: false, full_name: "another/repo" },
            { private: false, full_name: repo, default_branch: "main" },
        ]) {
            let reads = 0;
            await assert.rejects(approval.approveDraft(draft, {
                root,
                api: async () => { reads++; return metadata; },
            }), /matching public/);
            assert.equal(reads, 1, "Rejected repositories must not expose any source content");
        }
        const prSource = `https://github.com/${repo}/pull/1`;
        await assert.rejects(approval.approveDraft({ ...draft, sources: [prSource] }, {
            root,
            api: async (endpoint) => endpoint === `repos/${repo}`
                ? { private: false, fork: false, archived: false, full_name: repo, default_branch: "main" }
                : { html_url: prSource, merged_at: null, base: { ref: "main" } },
        }), /must be merged/);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
