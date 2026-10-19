import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex');

// Deliberately small lossless grammar: quantities and optionality remain literal.
// Unsupported templates/HTML must be reviewed, never deleted to make a row pass.
export function plainText(text) {
  if (/\{\{|\}\}|<\/?(?!br\b)[a-z!]|\[\[(?:File|Image|Media):/i.test(text)) throw new Error('UNSUPPORTED_WIKITEXT');
  const result = text.replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/\[\[([^\[\]]+)\]\]/g, (_, body) => {
      const parts = body.split('|');
      if (parts.length > 2 || !parts.at(-1).trim()) throw new Error('UNSUPPORTED_LINK');
      return (parts.length === 2 ? parts[1] : parts[0].replace(/^Cookbook:/i, '')).replaceAll('_', ' ');
    }).replace(/'{2,5}/g, '').trim();
  if (/\[\[|\]\]|\[https?:|<!--|-->|\{\||\|\}/i.test(result)) throw new Error('UNSUPPORTED_WIKITEXT');
  return result;
}

export function sections(text) {
  const matches = [...text.matchAll(/^(={2,6})\s*(.*?)\s*\1\s*$/gm)];
  return matches.map((m, i) => ({ level: m[1].length, heading: m[2].toLowerCase().trim(), raw: text.slice(m.index + m[0].length, matches[i + 1]?.index ?? text.length).trim() }));
}

function list(section, marker) {
  const lines = section.raw.split(/\r?\n/).filter(s => s.trim() && !/^\s*\[\[Category:[^\n]+\]\]\s*$/i.test(s));
  if (!lines.length || lines.some(s => !s.trimStart().startsWith(marker))) throw new Error('NON_LIST_OR_NESTED_CONTENT');
  return lines.map(line => {
    const body = line.trimStart().slice(1).trim();
    if (!body || /^[*#:;]/.test(body)) throw new Error('NON_LIST_OR_NESTED_CONTENT');
    return plainText(body);
  });
}

export function normalizePage(page, talk, expected) {
  const revision = page?.revisions?.find(r => r.revid === expected.revid);
  if (page?.pageid !== expected.pageid || page?.title !== expected.title || revision?.timestamp !== expected.timestamp || typeof revision?.slots?.main?.content !== 'string') throw new Error('PINNED_SOURCE_IDENTITY_MISMATCH');
  const raw = revision.slots.main.content;
  const talkTitle = expected.title.replace(/^Cookbook:/, 'Cookbook talk:');
  if (talk?.title !== talkTitle || (!talk.missing && !talk.revisions?.[0]?.slots?.main)) throw new Error('TALK_EVIDENCE_MISSING');
  const talkRevision = talk.revisions?.[0];
  const reasons = [];
  const templates = [...raw.matchAll(/\{\{\s*([^|}\n]+)/g)].map(m => m[1].trim().toLowerCase());
  const safeTemplates = new Set(['recipe', 'recipe summary', 'recipesummary', 'pagename', 'defaultsort:{{pagename']);
  if (templates.some(t => !safeTemplates.has(t))) reasons.push('TEMPLATE_REVIEW_REQUIRED');
  if (/copyright|attribut|permission|public.domain|adapted\s+(?:from|by)|taken\s+from|originally\s+(?:from|published)|\bsource\s*[:=]|<ref\b|\[https?:/i.test(raw)) reasons.push('ADDITIONAL_NOTICE_REVIEW_REQUIRED');
  if (talkRevision?.slots.main.content.trim()) reasons.push('TALK_REVIEW_REQUIRED');
  const parts = sections(raw);
  let ingredients = [], instructions = [], supplementary = [];
  try {
    const ins = parts.filter(s => s.heading === 'ingredients');
    const methods = parts.filter(s => /^(procedure|preparation|instructions|directions|method|procedures)$/.test(s.heading));
    if (ins.length !== 1 || methods.length !== 1 || ins[0].level !== 2 || methods[0].level !== 2) throw new Error('AMBIGUOUS_RECIPE_SECTIONS');
    // Subheadings must not silently truncate either core section.
    for (const main of [ins[0], methods[0]]) {
      const next = parts[parts.indexOf(main) + 1];
      if (next && next.level > main.level) throw new Error('SUBDIVIDED_RECIPE_SECTION');
    }
    ingredients = list(ins[0], '*');
    instructions = list(methods[0], '#');
    if (!ingredients.length || !instructions.length) throw new Error('INCOMPLETE_RECIPE');
    // Preserve equipment, warnings, serving and optional variants too. Categories
    // and metadata are outside recipe expression, not ingredients/instructions.
    supplementary = parts.filter(s => s !== ins[0] && s !== methods[0] && !/^(nutrition|references|external links|see also|gallery)$/.test(s.heading)).map(s => ({ heading: s.heading, text: plainText(s.raw.replace(/^\[\[Category:[^\n]+\]\]\s*$/gmi, '').trim()) }));
  } catch (error) { reasons.push(error.message); }
  const provenance = {
    sourceName: 'English Wikibooks Cookbook', sourcePageTitle: page.title,
    sourcePageId: page.pageid, sourceRevisionId: revision.revid, sourceRevisionTimestamp: revision.timestamp,
    sourceUrl: `https://en.wikibooks.org/wiki/${encodeURIComponent(page.title).replaceAll('%2F', '/')}`,
    sourceRevisionUrl: `https://en.wikibooks.org/w/index.php?oldid=${revision.revid}`,
    attribution: 'Wikibooks contributors; see the source page history',
    license: 'CC-BY-SA-4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    modifiedFromSource: true, transformation: 'Wiki links and emphasis normalized; literal ingredient quantities and instructions preserved; no media or nutrition imported.',
    mediaIncluded: false, sourceNutritionImportedAsAuthority: false,
    sourceTextSha256: hash(raw), talkPageTitle: talkTitle,
    talkRevisionId: talkRevision?.revid ?? null, talkRevisionTimestamp: talkRevision?.timestamp ?? null,
    talkTextSha256: hash(talkRevision?.slots.main.content ?? ''), talkMissing: talk.missing === true
  };
  return {
    id: `wikibooks_${page.pageid}_${revision.revid}`, title: page.title.slice('Cookbook:'.length),
    ingredients, instructions, supplementary, provenance,
    sourceWikitext: raw, talkWikitext: talkRevision?.slots.main.content ?? '',
    structure: ingredients.length && instructions.length && !reasons.some(r => /WIKITEXT|LINK|CONTENT|SECTION|INCOMPLETE/.test(r)) ? 'PASS' : 'HOLD',
    rights: reasons.some(r => /NOTICE|TEMPLATE|TALK/.test(r)) ? 'HOLD_PAGE_SPECIFIC_REVIEW' : 'STANDARD_TEXT_PATH_SCREEN_PASS',
    holdReasons: [...new Set(reasons)],
    recommendationState: 'NOT_ADMITTED', importAuthorized: false
  };
}
