import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const SITE_URL = "https://niceboys.pages.dev";
const DIST_DIR = resolve(process.cwd(), "dist");
const PAGES_DIR = resolve(process.cwd(), "src", "pages");
const OUTPUT_PATH = resolve(DIST_DIR, "sitemap.xml");

const DEFAULT_CHANGEFREQ = "monthly";
const DEFAULT_PRIORITY = "0.6";

const routeMeta = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/groupe": { changefreq: "monthly", priority: "0.9" },
  "/mentions": { changefreq: "yearly", priority: "0.3" },
  "/soutien": { changefreq: "yearly", priority: "0.3" }
};

function walkFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toRoutePath(distFilePath) {
  const relPath = relative(DIST_DIR, distFilePath).replace(/\\/g, "/");
  if (relPath === "index.html") return "/";
  if (relPath === "404.html") return null;
  if (relPath.endsWith("/index.html")) {
    const segment = relPath.slice(0, -"index.html".length);
    return `/${segment}`.replace(/\/+$/, "");
  }
  if (relPath.endsWith(".html")) {
    return `/${relPath.slice(0, -".html".length)}`;
  }
  return null;
}

function sourceFileForRoute(routePath) {
  if (routePath === "/") return resolve(PAGES_DIR, "index.astro");
  const normalized = routePath.startsWith("/") ? routePath.slice(1) : routePath;
  return resolve(PAGES_DIR, `${normalized}.astro`);
}

function formatDateToYmd(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

function gitLastModified(targetPath) {
  if (!existsSync(targetPath)) return null;

  try {
    const output = execFileSync("git", ["log", "-1", "--format=%cs", "--", targetPath], {
      encoding: "utf8"
    }).trim();
    return output || null;
  } catch {
    return null;
  }
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

if (!existsSync(DIST_DIR)) {
  throw new Error("Cannot generate sitemap: dist directory does not exist.");
}

const htmlFiles = walkFiles(DIST_DIR).filter((file) => file.toLowerCase().endsWith(".html"));
const sitemapEntries = [];

for (const htmlFile of htmlFiles) {
  const routePath = toRoutePath(htmlFile);
  if (!routePath) continue;

  const sourceFile = sourceFileForRoute(routePath);
  if (!existsSync(sourceFile)) continue;
  const lastmod = gitLastModified(sourceFile) ?? formatDateToYmd(statSync(htmlFile).mtime);
  const meta = routeMeta[routePath] ?? { changefreq: DEFAULT_CHANGEFREQ, priority: DEFAULT_PRIORITY };

  sitemapEntries.push({
    routePath,
    url: `${SITE_URL}${routePath === "/" ? "/" : routePath}`,
    lastmod,
    changefreq: meta.changefreq,
    priority: meta.priority
  });
}

sitemapEntries.sort((a, b) => a.routePath.localeCompare(b.routePath));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(entry.url)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(OUTPUT_PATH, xml, "utf8");
console.log(`Generated sitemap with ${sitemapEntries.length} URLs at ${OUTPUT_PATH}`);
