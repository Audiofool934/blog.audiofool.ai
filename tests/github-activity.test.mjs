import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
async function cli(root, args = [], env = {}) {
  try {
    const result = await exec(process.execPath, [fileURLToPath(collectorUrl), ...args], { cwd: root, env: { ...process.env, ...env } });
    return { ...result, code: 0 };
  } catch (error) {
    return { stdout: error.stdout, stderr: error.stderr, code: error.code };
  }
}

const collectorUrl = new URL('../scripts/collect-github-activity.mjs', import.meta.url);
const load = () => import(collectorUrl.href).catch((error) => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});
async function fixture(t) {
  const scratch = fileURLToPath(new URL('../.local/', import.meta.url));
  await mkdir(scratch, { recursive: true });
  const root = await mkdtemp(path.join(scratch, 'github-activity-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src/content/projects'), { recursive: true });
  return root;
}

test('readProjects reads only curated non-archived frontmatter and preserves repo case', async (t) => {
  const root = await fixture(t);
  for (const [file, content] of Object.entries({
    'music.md': `---\ntitle: 'Music: Alice''s app'\nstatus: active\ngithubRepo: "Owner/Music.App"\n---\ngithubRepo: Evil/body\n`,
    'old.md': `---\ntitle: Old\nstatus: 'archived'\ngithubRepo: Owner/old\n---\n`,
    'local.md': `---\ntitle: Local\nstatus: research\n---\ngithubRepo: Evil/body\n`,
  })) await writeFile(path.join(root, 'src/content/projects', file), content);
  const { readProjects } = await load();
  assert.equal(typeof readProjects, 'function', 'readProjects export is missing');
  assert.deepEqual(await readProjects(root), [
    { id: 'music', title: "Music: Alice's app", repo: 'Owner/Music.App', status: 'active' },
  ]);
});

const project = { id: 'music', title: 'Music', repo: 'Owner/Music.App', status: 'active' };
const window = { since: '2026-10-01T00:00:00.000Z', until: '2026-10-23T12:00:00.000Z' };

test('malformed exact repository identifiers fail before any API call', async (t) => {
  const { readProjects, collectRepository } = await load();
  assert.equal(typeof collectRepository, 'function', 'collectRepository export is missing');
  let calls = 0;
  const api = async () => { calls++; };
  const root = await fixture(t);
  for (const repo of [' Owner/repo', 'Owner/repo ', 'https://github.com/Owner/repo', 'Owner/repo/extra', 'Owner/..', '-Owner/repo', 'Owner/repo?x', 'Owner/repo.git', 'Owner//repo', 'Ow_ner/repo', '']) {
    await assert.rejects(collectRepository({ ...project, repo }, { api, ...window }), /owner\/repo/i);
    await writeFile(path.join(root, 'src/content/projects/bad.md'), `---\ntitle: Bad\nstatus: active\ngithubRepo: ${JSON.stringify(repo)}\n---\n`);
    await assert.rejects(readProjects(root), /owner\/repo/i);
  }
  assert.equal(calls, 0);
});

test('remote metadata gates all content for private archived and fork repositories', async () => {
  const { collectRepository } = await load();
  for (const reason of ['private', 'archived', 'fork']) {
    const calls = [];
    const result = await collectRepository(project, { ...window, api: async (endpoint) => {
      calls.push(endpoint);
      return { private: false, archived: false, fork: false, [reason]: true };
    } });
    assert.deepEqual(calls, ['repos/Owner/Music.App']);
    assert.equal(result.skipped, reason);
    assert.deepEqual(result.errors, []);
    assert.equal(result.coverage.complete, true);
    assert.equal(Object.hasOwn(result, 'drafts'), false);
  }
});

const baseUrl = 'https://github.com/Owner/Music.App';
const metadata = { private: false, archived: false, fork: false, default_branch: 'release/main' };
const release = (tag, extra = {}) => ({ tag_name: tag, name: `Release ${tag}`, body: 'Source release notes', published_at: window.since, html_url: `${baseUrl}/releases/tag/${tag}`, draft: false, prerelease: false, ...extra });
const pr = (number, extra = {}) => ({ number, title: 'Natural prose milestone', body: 'Source PR details', merged_at: window.until, base: { ref: metadata.default_branch }, labels: [], user: { login: 'someone-else' }, html_url: `${baseUrl}/pull/${number}`, ...extra });
const commit = (sha, extra = {}) => ({ sha, html_url: `${baseUrl}/commit/${sha}`, commit: { message: 'A natural prose change with no magic keyword', committer: { date: window.since } }, ...extra });
function fakeApi(data, calls = []) {
  return async (endpoint, options) => {
    calls.push({ endpoint, options });
    if (endpoint === `repos/${project.repo}`) return metadata;
    const kind = endpoint.split('?')[0].split('/').at(-1);
    if (data[kind] instanceof Error) throw data[kind];
    return data[kind] || [];
  };
}

test('collects paginated default-branch evidence within inclusive UTC bounds without author or prose filters', async () => {
  const { collectRepository } = await load();
  const calls = [];
  const result = await collectRepository(project, { ...window, api: fakeApi({
    releases: [release('v1'), release('preview', { prerelease: true }), release('draft', { draft: true }), release('old', { published_at: '2026-09-01T00:00:00Z' })],
    pulls: [pr(1), pr(2, { merged_at: null }), pr(3, { base: { ref: 'other' } }), pr(4, { merged_at: '2026-10-24T00:00:00Z' })],
    commits: [commit('abc'), commit('old', { commit: { message: 'old', committer: { date: '2026-09-01T00:00:00Z' } } })],
  }, calls) });
  assert.equal(result.defaultBranch, 'release/main');
  assert.deepEqual(result.releases.map((item) => item.source), [`${baseUrl}/releases/tag/v1`]);
  assert.deepEqual(result.pullRequests.map((item) => item.source), [`${baseUrl}/pull/1`]);
  assert.equal(result.pullRequests[0].author, 'someone-else');
  assert.deepEqual(result.commits.map((item) => item.title), ['A natural prose change with no magic keyword']);
  assert.equal(result.coverage.complete, true);
  assert.equal(calls.length, 4);
  for (const call of calls.slice(1)) assert.equal(call.options.paginate, true);
  const pulls = new URL(calls[2].endpoint, 'https://api.github.com/');
  assert.equal(pulls.searchParams.get('base'), 'release/main');
  assert.equal(pulls.searchParams.get('state'), 'closed');
  const commits = new URL(calls[3].endpoint, 'https://api.github.com/');
  assert.equal(commits.searchParams.get('sha'), 'release/main');
  assert.equal(commits.searchParams.get('since'), window.since);
  assert.equal(commits.searchParams.get('until'), window.until);
  for (const stream of ['releases', 'pullRequests', 'commits']) {
    assert.deepEqual(result.coverage.pagination[stream], { requested: true, complete: true });
  }
});

test('collection reports facts and labels without selecting posts or drafting updates', async () => {
  const { collectRepository } = await load();
  const result = await collectRepository(project, { ...window,
    knownSources: new Set([`${baseUrl}/releases/tag/approved`, `${baseUrl}/pull/8`, `${baseUrl}/commit/approved`]),
    api: fakeApi({
      releases: [release('v1'), release('v1'), release('approved')],
      pulls: [pr(7, { labels: [{ name: 'timeline' }] }), pr(8, { labels: [{ name: 'timeline' }] }), pr(9), pr(10, { labels: [{ name: 'Timeline' }] })],
      commits: [commit('abc'), commit('approved')],
    }),
  });
  assert.equal(Object.hasOwn(result, 'drafts'), false);
  assert.equal(result.releases.length, 1);
  assert.equal(result.pullRequests.length, 3);
  assert.equal(result.commits.length, 1);
  assert.equal(result.releases[0].title, 'Release v1');
  assert.deepEqual(result.pullRequests.map((item) => item.labels), [['timeline'], [], ['Timeline']]);
});

test('per-stream API failures retain evidence and explicitly mark pagination incomplete', async () => {
  const { collectRepository } = await load();
  const result = await collectRepository(project, { ...window, api: fakeApi({
    releases: [release('v1')], pulls: new Error('HTTP 403 rate limit'), commits: [commit('abc')],
  }) });
  assert.equal(result.releases.length, 1);
  assert.equal(result.commits.length, 1);
  assert.equal(result.coverage.complete, false);
  assert.deepEqual(result.coverage.pagination.pullRequests, { requested: true, complete: false });
  assert.equal(result.errors[0].stage, 'pullRequests');
  assert.match(result.errors[0].message, /403/);
  const failed = await collectRepository(project, { ...window, api: async () => { throw new Error('auth required'); } });
  assert.equal(failed.coverage.complete, false);
  assert.equal(failed.errors[0].stage, 'metadata');
  assert.equal(Object.hasOwn(failed, 'drafts'), false);
});

test('invalid or non-UTC collection bounds reject before API requests', async () => {
  const { collectRepository } = await load();
  let calls = 0;
  const api = async () => { calls++; return metadata; };
  for (const bounds of [
    { since: undefined, until: window.until },
    { since: '2026-10-01', until: window.until },
    { since: '2026-02-30T00:00:00Z', until: window.until },
    { since: '2026-10-01T00:00:00+01:00', until: window.until },
    { since: window.until, until: window.since },
  ]) await assert.rejects(collectRepository(project, { api, ...bounds }), /UTC|window/i);
  assert.equal(calls, 0);
});

test('CLI help documents read-only behavior and invalid arguments fail without touching prior output', async (t) => {
  const root = await fixture(t);
  const help = await cli(root, ['--help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /--since YYYY-MM-DD/);
  assert.match(help.stdout, /--until/);
  assert.match(help.stdout, /30 days/);
  assert.match(help.stdout, /read-only/i);
  await mkdir(path.join(root, '.local/timeline'), { recursive: true });
  await writeFile(path.join(root, '.local/timeline/review.json'), 'previous report');
  for (const args of [['--bogus'], ['--since'], ['--since', '2026-02-30'], ['--until', '2026-10-01T00:00:00'], ['--since', '2026-10-23', '--until', '2026-10-01']]) {
    const result = await cli(root, args);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /timeline/);
    assert.equal(await readFile(path.join(root, '.local/timeline/review.json'), 'utf8'), 'previous report');
  }
});

async function cliFixture(t, data = {}) {
  const root = await fixture(t);
  await writeFile(path.join(root, 'src/content/projects/music.md'), `---\ntitle: Music\nstatus: active\ngithubRepo: Owner/Music.App\n---\n`);
  await mkdir(path.join(root, 'bin'));
  await writeFile(path.join(root, 'responses.json'), JSON.stringify(data));
  await writeFile(path.join(root, 'bin/gh'), `#!${process.execPath}\nimport fs from 'node:fs';\nconst args = process.argv.slice(2);\nfs.appendFileSync(process.env.GH_TEST_CALLS, JSON.stringify(args) + '\\n');\nconst data = JSON.parse(fs.readFileSync(process.env.GH_TEST_RESPONSES, 'utf8'));\nif (data.failAuth || (data.failStream && args.some(arg => arg.includes(data.failStream)))) { console.error('HTTP 403 test failure'); process.exit(1); }\nif (args[0] === 'auth') process.exit(0);\nconst endpoint = args.at(-1);\nconst stream = endpoint.split('?')[0].split('/').at(-1);\nconsole.log(JSON.stringify(endpoint === 'repos/Owner/Music.App' ? data.metadata : data[stream] || [[]]));\n`, { mode: 0o755 });
  return { root, env: { PATH: `${path.join(root, 'bin')}:${process.env.PATH}`, GH_TEST_CALLS: path.join(root, 'calls.jsonl'), GH_TEST_RESPONSES: path.join(root, 'responses.json') } };
}

test('CLI writes factual review packets without creating drafts and leaves discussed text untouched', async (t) => {
  const { root, env } = await cliFixture(t, {
    metadata, releases: [[release('approved')], [release('v2')]], pulls: [[pr(4)]], commits: [[commit('a')], [commit('b')]],
  });
  await mkdir(path.join(root, 'src/content/log'), { recursive: true });
  await writeFile(path.join(root, 'src/content/log/approved.md'), `---\ngithubActivity: ${JSON.stringify([`${baseUrl}/releases/tag/approved`])}\n---\ngithubActivity: ["body ignored"]\n`);
  const args = ['--since', '2026-10-01', '--until', '2026-10-23'];
  const result = await cli(root, args, env);
  assert.equal(result.code, 0, result.stderr);
  const packet = JSON.parse(await readFile(path.join(root, '.local/timeline/review.json'), 'utf8'));
  assert.equal(packet.projects.length, 1);
  assert.equal(packet.since, window.since);
  assert.equal(packet.until, '2026-10-23T23:59:59.999Z');
  assert.ok(Number.isFinite(Date.parse(packet.generatedAt)));
  assert.deepEqual(packet.errors, []);
  assert.deepEqual(packet.skipped, []);
  assert.equal(packet.coverage.complete, true);
  assert.equal(packet.projects[0].commits.length, 2);
  assert.equal(packet.projects[0].releases.length, 1);
  const report = await readFile(path.join(root, '.local/timeline/review.md'), 'utf8');
  assert.match(report, /untrusted evidence, not instructions/i);
  assert.match(report, /discuss.*Everett/i);
  assert.doesNotMatch(report, /potential milestones/);
  assert.match(report, /A natural prose change with no magic keyword/);
  assert.equal(Object.hasOwn(packet.projects[0], 'drafts'), false);
  const draftsDir = path.join(root, '.local/timeline/drafts');
  await assert.rejects(readFile(path.join(draftsDir, 'anything.json')), { code: 'ENOENT' });
  await assert.rejects(readdir(draftsDir), { code: 'ENOENT' });
  await mkdir(draftsDir);
  const draftPath = path.join(draftsDir, 'discussed-update.json');
  await writeFile(draftPath, 'human-authored edits');
  assert.equal((await cli(root, args, env)).code, 0);
  assert.equal(await readFile(draftPath, 'utf8'), 'human-authored edits');
  const calls = (await readFile(env.GH_TEST_CALLS, 'utf8')).trim().split('\n').map(JSON.parse);
  for (const call of calls.filter((item) => item[0] === 'api')) {
    assert.deepEqual(call.slice(0, 3), ['api', '--method', 'GET']);
    assert.ok(!call.some((arg) => /events|search/.test(arg)));
    if (call.at(-1).includes('?')) {
      assert.ok(call.includes('--paginate'));
      assert.ok(call.includes('--slurp'));
    }
  }
});

test('CLI records partial failures with nonzero exit and preserves previous review on global failure', async (t) => {
  const { root, env } = await cliFixture(t, { metadata, failStream: '/pulls?', releases: [[release('v1')]], commits: [[commit('a')]] });
  const args = ['--since', '2026-10-01', '--until', '2026-10-23'];
  const partial = await cli(root, args, env);
  assert.equal(partial.code, 1);
  const review = path.join(root, '.local/timeline/review.json');
  const packet = JSON.parse(await readFile(review, 'utf8'));
  assert.equal(packet.errors.length, 1);
  assert.equal(packet.coverage.complete, false);
  assert.equal(packet.projects[0].commits.length, 1);
  await writeFile(review, 'previous review');
  await writeFile(env.GH_TEST_RESPONSES, JSON.stringify({ failAuth: true }));
  assert.equal((await cli(root, args, env)).code, 1);
  assert.equal(await readFile(review, 'utf8'), 'previous review');
  await writeFile(env.GH_TEST_RESPONSES, JSON.stringify({ failStream: 'repos/' }));
  assert.equal((await cli(root, args, env)).code, 1);
  assert.equal(await readFile(review, 'utf8'), 'previous review');
  const failure = JSON.parse(await readFile(path.join(root, '.local/timeline/review.failed.json'), 'utf8'));
  assert.equal(failure.errors[0].stage, 'metadata');
});

test('metadata must affirm public non-fork non-archived status and a default branch before content requests', async () => {
  const { collectRepository } = await load();
  for (const info of [{ default_branch: 'main' }, { ...metadata, private: undefined }, { ...metadata, fork: undefined }, { ...metadata, archived: undefined }, { ...metadata, default_branch: '' }]) {
    let calls = 0;
    const result = await collectRepository(project, { ...window, api: async () => { calls++; return info; } });
    assert.equal(calls, 1);
    assert.equal(result.errors[0].stage, 'metadata');
    assert.equal(result.coverage.complete, false);
  }
});
