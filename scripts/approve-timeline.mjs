// Explicit local approval only. This command never commits, pushes, or deploys.
import { execFile } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { validateRepository } from "./collect-github-activity.mjs";

const exec = promisify(execFile);
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sourceEndpoint(source, repo) {
    const prefix = `https://github.com/${repo}/`;
    if (typeof source !== "string" || !source.startsWith(prefix)) throw new Error("Sources must belong to the project's GitHub repository");
    const tail = source.slice(prefix.length);
    if (/^commit\/[a-f0-9]{40}$/.test(tail)) return `repos/${repo}/commits/${tail.slice(7)}`;
    if (/^pull\/[1-9]\d*$/.test(tail)) return `repos/${repo}/pulls/${tail.slice(5)}`;
    if (/^releases\/tag\/[A-Za-z0-9._%/-]+$/.test(tail) && !tail.includes("..")) {
        return `repos/${repo}/releases/tags/${encodeURIComponent(decodeURIComponent(tail.slice(13)))}`;
    }
    throw new Error("Sources must be canonical commit, merged PR, or release URLs");
}

export function draftToMarkdown(draft, repo) {
    validateRepository(repo);
    if (!draft || !slug.test(draft.project) || !slug.test(draft.id)) throw new Error("Invalid draft project or ID");
    const date = typeof draft.date === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(draft.date) ? new Date(draft.date) : null;
    if (!date || !Number.isFinite(date.valueOf()) || date.toISOString().replace(".000Z", "Z") !== draft.date.replace(".000Z", "Z")) throw new Error("Draft date must be a valid UTC timestamp");
    if (!draft.id.startsWith(draft.date.slice(0, 10) + "-")) throw new Error("Draft ID must start with its publication date");
    for (const key of ["title", "description", "body"]) {
        if (typeof draft[key] !== "string" || !draft[key].trim()) throw new Error(`Draft ${key} is required`);
    }
    if (/[\r\n]/.test(draft.title + draft.description)) throw new Error("Title and description must be single lines");
    if (!Array.isArray(draft.sources) || !draft.sources.length) throw new Error("Draft needs GitHub evidence");
    for (const source of draft.sources) sourceEndpoint(source, repo);
    return `---\ntitle: ${JSON.stringify(draft.title)}\npubDate: ${JSON.stringify(draft.date)}\ntags: ["Projects"]\ndescription: ${JSON.stringify(draft.description)}\ngithubActivity: ${JSON.stringify(draft.sources)}\n---\n\n${draft.body.trim()}\n`;
}

async function githubApi(endpoint) {
    const { stdout } = await exec("gh", ["api", "--hostname", "github.com", endpoint], { timeout: 60000, maxBuffer: 16 * 1024 * 1024 });
    return JSON.parse(stdout);
}

export async function approveDraft(draft, { root = process.cwd(), api = githubApi } = {}) {
    if (!draft || !slug.test(draft.project)) throw new Error("Invalid draft project");
    const project = await readFile(path.join(root, "src/content/projects", draft.project + ".md"), "utf8");
    const frontmatter = project.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    const raw = frontmatter?.match(/^githubRepo:\s*(.+)$/m)?.[1].trim();
    const repo = raw?.replace(/^(['"])(.*)\1$/, "$2");
    const markdown = draftToMarkdown(draft, repo);
    const metadata = await api(`repos/${repo}`);
    if (!metadata || metadata.private !== false || metadata.fork !== false || metadata.archived !== false || metadata.full_name !== repo || typeof metadata.default_branch !== "string" || !metadata.default_branch) throw new Error("Approval requires the matching public, original, active repository");
    for (const source of draft.sources) {
        const endpoint = sourceEndpoint(source, repo);
        const evidence = await api(endpoint);
        if (evidence.html_url !== source) throw new Error(`Cannot verify source: ${source}`);
        if (endpoint.includes("/pulls/") && (!evidence.merged_at || evidence.base?.ref !== metadata.default_branch)) throw new Error("PR evidence must be merged into the default branch");
        if (endpoint.includes("/releases/tags/") && (evidence.draft || evidence.prerelease || !evidence.published_at)) throw new Error("Release evidence must be published and stable");
    }
    const logs = path.join(root, "src/content/log");
    for (const file of await readdir(logs)) {
        if (!file.endsWith(".md")) continue;
        const content = await readFile(path.join(logs, file), "utf8");
        const sources = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1].match(/^githubActivity:\s*(\[[^\r\n]*\])\s*$/m)?.[1];
        if (sources && JSON.parse(sources).some((source) => draft.sources.includes(source))) throw new Error(`Source already approved in ${file}`);
    }
    const target = path.join(logs, draft.id + ".md");
    await writeFile(target, markdown, { encoding: "utf8", flag: "wx" });
    return target;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === "--help") {
        console.log("Usage: npm run timeline:approve -- .local/timeline/drafts/<draft>.json\nApproves the reviewed text into src/content/log/. Does not commit, push, or deploy.");
        return;
    }
    if (args.length !== 1 || args[0].startsWith("-")) throw new Error("Pass exactly one reviewed draft JSON file; use --help for usage");
    const draft = JSON.parse(await readFile(args[0], "utf8"));
    const target = await approveDraft(draft);
    console.log(`Approved locally: ${target}\nReview the diff, run checks, and publish separately.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((error) => { console.error(`[timeline:approve] ${error.message}`); process.exitCode = 1; });
}
