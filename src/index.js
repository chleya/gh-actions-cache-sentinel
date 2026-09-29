const fs = require('fs');
const core = { getInput: n => process.env[`INPUT_${n.toUpperCase().replaceAll('-', '_')}`] || '', setFailed: m => { console.error(m); process.exitCode = 1; }, info: console.log, warning: console.warn };
const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
if (!token || !owner || !repo) { core.setFailed('github-token and GITHUB_REPOSITORY are required'); return; }
const api = async (path, options = {}) => { const res = await fetch(`https://api.github.com${path}`, { ...options, headers: {'accept':'application/vnd.github+json','authorization':`Bearer ${token}`,'x-github-api-version':'2022-11-28', ...(options.headers || {})} }); if (!res.ok) throw new Error(`${options.method || 'GET'} ${path}: ${res.status} ${await res.text()}`); return res.status === 204 ? null : res.json(); };
const allCaches = async () => { const rows=[]; let page=1; while(true) { const result=await api(`/repos/${owner}/${repo}/actions/caches?per_page=100&page=${page}`); rows.push(...(result.actions_caches || [])); if (rows.length >= result.total_count || !result.actions_caches?.length) return rows; page++; } };
(async () => { try {
  const caches = await allCaches(); const event = JSON.parse(process.env.GITHUB_EVENT_PATH ? fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8') : '{}');
  const closedPr = event.pull_request?.number; const prune = core.getInput('prune-on-pr-close') !== 'false'; let deleted=0;
  for (const cache of caches) { const isClosedPrCache = closedPr && cache.ref === `refs/pull/${closedPr}/merge`; if (prune && isClosedPrCache) { await api(`/repos/${owner}/${repo}/actions/caches/${cache.id}`, {method:'DELETE'}); deleted++; } }
  const remaining = await allCaches(); const bytes = remaining.reduce((sum, c) => sum + (c.size_in_bytes || 0), 0); const gb = bytes / 1024 ** 3; const quota=10; const used=Math.min(100, gb/quota*100); const bar = '█'.repeat(Math.round(used/10)) + '░'.repeat(10-Math.round(used/10));
  const markdown = `## Actions Cache Health

| Metric | Value |
|---|---:|
| Cache entries | ${remaining.length} |
| Storage used | ${gb.toFixed(2)} GiB / ${quota} GiB |
| Utilization | ${used.toFixed(1)}% |
| Deleted this run | ${deleted} |

\`${bar}\` ${used < 80 ? 'Healthy' : used < 95 ? 'Watch' : 'Critical'}
`;
  const summary=process.env.GITHUB_STEP_SUMMARY; if(summary) fs.appendFileSync(summary, markdown); core.info(markdown.replaceAll('\n',' '));
} catch (error) { core.setFailed(error.stack || String(error)); } })();
