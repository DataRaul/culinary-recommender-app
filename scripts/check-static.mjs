import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const files = [];
const walk = dir => { for (const name of readdirSync(dir)) { if (name === "node_modules" || name === ".git") continue; const path = join(dir,name); statSync(path).isDirectory() ? walk(path) : files.push(path); } };
walk(root);
for (const file of files.filter(file => extname(file) === ".js" || extname(file) === ".mjs")) {
  const result = spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  if (result.status !== 0) { console.error(result.stderr); process.exit(result.status || 1); }
}
const html = readFileSync(join(root,"index.html"),"utf8");
for (const required of ["<main","aria-label=\"Main navigation\"","manifest.webmanifest","src/bootstrap.js","search.css","profile-packs.css"]) if (!html.includes(required)) throw new Error(`index.html missing ${required}`);
const css = readFileSync(join(root,"styles.css"),"utf8");
for (const token of ["--bg:","--surface:","--text:","--focus:","prefers-reduced-motion"]) if (!css.includes(token)) throw new Error(`styles.css missing ${token}`);
const profileCss = readFileSync(join(root,"profile-packs.css"),"utf8");
for (const token of ["priority-pack-grid","priority-pack-card","pack-scope"]) if (!profileCss.includes(token)) throw new Error(`profile-packs.css missing ${token}`);
console.log(`Static checks passed for ${files.length} files.`);
