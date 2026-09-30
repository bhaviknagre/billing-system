// Builds www/ from ../billing-app.html: bundles native.js and stores fonts locally so the app works offline.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { build } from "esbuild";

const WWW = "www";
mkdirSync(`${WWW}/fonts`, { recursive: true });

// Fonts: download the latin woff2 files once.
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap";
if (!existsSync(`${WWW}/fonts/fonts.css`)) {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
  const css = await (await fetch(FONTS_URL, { headers: { "User-Agent": UA } })).text();
  const blocks = css.split("/* ").filter((b) => b.startsWith("latin */"));
  let out = "";
  const names = new Map(); // variable fonts reuse one file for several weights
  for (const b of blocks) {
    const url = b.match(/url\((https:[^)]+\.woff2)\)/)[1];
    if (!names.has(url)) {
      names.set(url, `f${names.size}.woff2`);
      writeFileSync(`${WWW}/fonts/${names.get(url)}`, Buffer.from(await (await fetch(url)).arrayBuffer()));
    }
    const name = names.get(url);
    out += b.slice("latin */".length).replace(url, name) + "\n";
  }
  writeFileSync(`${WWW}/fonts/fonts.css`, out);
}

let html = readFileSync("../billing-app.html", "utf8");
html = html
  .replace(/<link rel="preconnect"[^>]*>\n?/, "")
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="fonts/fonts.css" rel="stylesheet">')
  .replace("<script>", '<script src="native.js"></script>\n<script>');
writeFileSync(`${WWW}/index.html`, html);

await build({
  entryPoints: ["src/native.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "chrome90",
  outfile: `${WWW}/native.js`,
  external: ["canvg", "dompurify"],
});
console.log("www/ built");
