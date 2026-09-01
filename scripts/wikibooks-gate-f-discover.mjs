const API = "https://en.wikibooks.org/w/api.php";
const USER_AGENT = "culinary-recommender-app/1.1 (https://github.com/DataRaul/culinary-recommender-app)";

const requestJson = async params => {
  const url = new URL(API);
  for (const [key, value] of Object.entries({ action: "query", format: "json", formatversion: "2", ...params })) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Api-User-Agent": USER_AGENT,
      Accept: "application/json"
    }
  });
  if (!response.ok) throw new Error(`Wikibooks API ${response.status} for ${url}`);
  return response.json();
};

const listRecipePages = async () => {
  const rows = [];
  let cmcontinue;
  do {
    const data = await requestJson({
      list: "categorymembers",
      cmtitle: "Category:Recipes",
      cmnamespace: 102,
      cmlimit: 500,
      cmprop: "ids|title|timestamp",
      cmsort: "sortkey",
      cmdir: "asc",
      cmcontinue
    });
    rows.push(...(data.query?.categorymembers || []));
    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);
  return rows;
};

const readPage = async pageid => {
  const data = await requestJson({
    pageids: pageid,
    prop: "revisions|categories",
    rvprop: "ids|timestamp|content",
    rvslots: "main",
    cllimit: "max"
  });
  const page = data.query?.pages?.[0];
  const revision = page?.revisions?.[0];
  return {
    pageid: page?.pageid,
    title: page?.title,
    revid: revision?.revid,
    parentid: revision?.parentid,
    timestamp: revision?.timestamp,
    categories: (page?.categories || []).map(row => row.title),
    wikitext: revision?.slots?.main?.content || ""
  };
};

const sampleTitles = new Set([
  "Cookbook:Adobo Chicken (Philippine)",
  "Cookbook:Baba Ganoush",
  "Cookbook:Baingan Bartha (South Indian Eggplant with Chili) II",
  "Cookbook:Baked Beans",
  "Cookbook:Bruschetta",
  "Cookbook:Caprese Salad",
  "Cookbook:Gazpacho",
  "Cookbook:Greek Chicken Wrap",
  "Cookbook:Huevos Rancheros",
  "Cookbook:Refried Beans",
  "Cookbook:Spanish Omelet",
  "Cookbook:Tzatziki"
]);

const pages = await listRecipePages();
const chosen = pages.filter(row => sampleTitles.has(row.title));
const missingTitles = [...sampleTitles].filter(title => !chosen.some(row => row.title === title));
const details = [];
for (const row of chosen) {
  const page = await readPage(row.pageid);
  details.push({
    ...page,
    wikitextPreview: page.wikitext.slice(0, 9000),
    wikitextLength: page.wikitext.length
  });
  await new Promise(resolve => setTimeout(resolve, 150));
}

console.log(JSON.stringify({
  schemaVersion: "wikibooks-gate-f-discovery-v1",
  source: "English Wikibooks Cookbook",
  api: API,
  category: "Category:Recipes",
  recipePageCount: pages.length,
  firstPage: pages[0] || null,
  lastPage: pages.at(-1) || null,
  missingTitles,
  sampled: details
}, null, 2));
