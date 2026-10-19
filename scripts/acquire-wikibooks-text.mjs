import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function api(params) {
  const url = new URL('https://en.wikibooks.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...params });
  const response = await fetch(url, { signal: AbortSignal.timeout(60000), headers: { 'user-agent': 'CulinaryRecommender/1.0 (offline text acquisition; https://github.com/DataRaul/culinary-recommender-app)' } });
  if (!response.ok) throw new Error(`WIKIBOOKS_HTTP_${response.status}`);
  const payload = await response.json();
  if (payload.error || payload.warnings || payload.continue) throw new Error(`WIKIBOOKS_INCOMPLETE_${JSON.stringify(payload.error || payload.warnings || payload.continue)}`);
  return payload;
}

// The cache is resumable. Each response is checked against the requested identities
// before it can be reused; a cache filename is never an identity certificate.
export function checkBatch(payload, requested, kind) {
  if (!Array.isArray(payload?.query?.pages)) throw new Error('WIKIBOOKS_PAGES_MISSING');
  const pages = payload.query.pages;
  if (kind === 'revisions') {
    const found = pages.flatMap(p => (p.revisions || []).map(r => r.revid));
    if (found.length !== requested.length || new Set(found).size !== found.length || requested.some(id => !found.includes(id))) throw new Error('WIKIBOOKS_REVISION_MISMATCH');
  } else if (pages.length !== requested.length || requested.some(title => !pages.some(p => p.title === title))) {
    throw new Error('WIKIBOOKS_TALK_IDENTITY_MISMATCH');
  }
  for (const page of pages) {
    if (page.missing === true && kind === 'talk') continue;
    if (!page.revisions?.length || page.revisions.some(r => typeof r.slots?.main?.content !== 'string' || !r.timestamp || r.slots.main.contentmodel !== 'wikitext')) throw new Error('WIKIBOOKS_CONTENT_UNAVAILABLE');
  }
  return pages;
}

export async function acquire(discoveryPath, cacheRoot) {
  const discovery = JSON.parse(await readFile(discoveryPath, 'utf8'));
  if (!discovery.sourceUniverseComplete || discovery.records.length !== discovery.returnedRecordCount) throw new Error('DISCOVERY_INCOMPLETE');
  const root = resolve(cacheRoot);
  await mkdir(root, { recursive: true });
  const receipts = [];
  for (const kind of ['revisions', 'talk']) {
    const ids = discovery.records.map(r => kind === 'revisions' ? r.revid : r.title.replace(/^Cookbook:/, 'Cookbook talk:'));
    if (new Set(ids).size !== ids.length) throw new Error('DISCOVERY_DUPLICATE_IDENTITY');
    for (let start = 0; start < ids.length; start += 50) {
      const requested = ids.slice(start, start + 50);
      const path = resolve(root, `${kind}-${String(start).padStart(5, '0')}.json`);
      let payload;
      try { payload = JSON.parse(await readFile(path, 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (!payload) {
        payload = await api({ prop: 'revisions', rvprop: 'ids|timestamp|content', rvslots: 'main', ...(kind === 'revisions' ? { revids: requested.join('|') } : { titles: requested.join('|') }) });
        checkBatch(payload, requested, kind);
        await writeFile(path, JSON.stringify(payload) + '\n');
      }
      const pages = checkBatch(payload, requested, kind);
      receipts.push({ kind, start, requested, file: path.split('/').at(-1), sha256: sha(await readFile(path)), pages: pages.length });
      if (start % 500 === 0) console.log(`${kind}: ${Math.min(start + 50, ids.length)}/${ids.length}`);
    }
  }
  const receipt = { schema: 'WIKIBOOKS_PINNED_TEXT_CACHE_V1', acquiredAt: new Date().toISOString(), discoverySha256: sha(await readFile(discoveryPath)), records: discovery.records.length, receipts, productionWrites: 0 };
  await writeFile(resolve(root, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [discovery, cache] = process.argv.slice(2);
  if (!discovery || !cache) throw new Error('Usage: node scripts/acquire-wikibooks-text.mjs DISCOVERY CACHE');
  const result = await acquire(discovery, cache);
  console.log(JSON.stringify({ records: result.records, batches: result.receipts.length, productionWrites: 0 }));
}
