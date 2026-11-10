// Signale les pages du site aux moteurs IndexNow (Bing, et via lui DuckDuckGo, Ecosia, Yahoo ; Yandex, Seznam, Naver…).
// Lancé par le workflow de déploiement, après la mise en ligne.
//
//   node scripts/indexnow.mjs            -> envoie la liste des URL du sitemap
//   node scripts/indexnow.mjs --dry-run  -> affiche seulement ce qui serait envoyé
//
// La clé est le fichier public/<clé>.txt (32 caractères hexadécimaux) : NE PAS SUPPRIMER,
// les moteurs le lisent pour vérifier que les signalements viennent bien du propriétaire du site.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE_URL = "https://niceboys.pages.dev";
const ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"];
const dryRun = process.argv.includes("--dry-run");

const publicDir = resolve(process.cwd(), "public");
const keyFiles = readdirSync(publicDir).filter((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (keyFiles.length !== 1) {
  throw new Error(`IndexNow : 1 fichier-clé attendu dans public/, trouvé ${keyFiles.length}.`);
}
const keyFile = keyFiles[0];
const key = readFileSync(resolve(publicDir, keyFile), "utf8").trim();
if (`${key}.txt` !== keyFile) {
  throw new Error(`IndexNow : le contenu de ${keyFile} doit être exactement la clé.`);
}

const sitemapPath = resolve(process.cwd(), "dist", "sitemap.xml");
if (!existsSync(sitemapPath)) {
  throw new Error("IndexNow : dist/sitemap.xml introuvable, lancer `npm run build` d'abord.");
}
const urlList = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

const payload = {
  host: new URL(SITE_URL).host,
  key,
  keyLocation: `${SITE_URL}/${keyFile}`,
  urlList
};

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  console.log(`(dry-run) ${urlList.length} URL seraient envoyées à : ${ENDPOINTS.join(", ")}`);
  process.exit(0);
}

let accepted = 0;
for (const endpoint of ENDPOINTS) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    });
    // 200 = reçu, 202 = reçu (vérification de la clé en attente)
    const ok = response.status === 200 || response.status === 202;
    if (ok) accepted += 1;
    console.log(`${endpoint} -> HTTP ${response.status}${ok ? " (signal reçu)" : ""}`);
  } catch (error) {
    console.log(`${endpoint} -> erreur réseau : ${error.message}`);
  }
}

console.log(`IndexNow : ${urlList.length} URL signalées, ${accepted}/${ENDPOINTS.length} moteur(s) ont accepté.`);
if (accepted === 0) process.exit(1);
