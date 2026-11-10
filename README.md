# Nice Boys – site du tribute Guns N' Roses

Site vitrine du groupe **Nice Boys**, tribute band Guns N' Roses basé dans l'Ain (01).

| | |
|---|---|
| **Site en ligne** | https://niceboys.pages.dev (adresse officielle tant que le groupe n'a pas son propre domaine) |
| **Dépôt** | https://github.com/cportet/niceboys-site |
| **Hébergement** | Cloudflare Pages, projet `niceboys` |
| **Technologie** | [Astro](https://astro.build) 5, site 100 % statique, Node 22 |

> Ce fichier sert de mode d'emploi **pour les humains comme pour les IA** qui travaillent sur le site.
> Les règles de la section [Règles à respecter](#règles-à-respecter) sont obligatoires.

---

## Démarrer en local

```bash
npm ci            # installer les dépendances
npm run dev       # serveur de développement (http://localhost:4321)
npm run build     # build de production dans dist/ + génération du sitemap
npm run preview   # servir le build de dist/ (http://localhost:4321) — à utiliser pour tester avant une PR
```

Les statistiques (GoatCounter, Microsoft Clarity) ne se chargent pas sur `localhost`.
Pour les couper aussi ailleurs : `PUBLIC_ENABLE_THIRD_PARTY_SCRIPTS=false npm run build`.

---

## Organisation du projet

```
.github/workflows/deploy-pages.yml   Build + déploiement Cloudflare Pages + IndexNow
scripts/generate-sitemap.mjs         Génère dist/sitemap.xml après le build
scripts/indexnow.mjs                 Signale les pages à Bing & co (IndexNow)
public/                              Fichiers copiés tels quels à la racine du site
  sw.js, offline.html                PWA : service worker + page hors ligne
  site.webmanifest, *.png            PWA : manifeste et icônes
  6e60b811cfbd97b394f7259d9e1b4cd3.txt   Clé IndexNow — NE PAS SUPPRIMER
  BingSiteAuth.xml, googlec8c5….html     Vérifications Bing / Google — NE PAS SUPPRIMER
  images/group/                      Photos du groupe (miniature + grande version)
src/
  data/       Contenu éditable (concerts, photos, contact) + données structurées
  components/ Morceaux de pages réutilisables (header, footer, cartes, carrousel…)
  layouts/    BaseLayout.astro : <head> commun (SEO, réseaux sociaux, stats, PWA)
  pages/      Une page = un fichier (index.astro → /, groupe.astro → /groupe/…)
  styles/     styles.css : feuille de style unique
```

Le dossier `pub/` (ignoré par git) est une ancienne copie manuelle du site : ne jamais le committer.

---

## Mettre à jour le contenu

La plupart des mises à jour se font **uniquement dans `src/data/`**, sans toucher au code.

### Ajouter un concert — `src/data/events.json`

Ajouter un objet en tête de liste :

```json
{
  "name": "Nom de la salle ou de l'événement",
  "date": "2026-12-31",
  "status": "scheduled",
  "venueName": "Nom de la salle",
  "locationAddress": "Ville, Département, France",
  "info": "Infos pratiques (horaire, entrée…) ou vide",
  "uiDay": "Jeu. 31 Décembre",
  "uiPlace": "📍 Ville (01)",
  "sourceUrl": "https://www.facebook.com/events/…",
  "description": "Concert Nice Boys - Tribute Guns N' Roses"
}
```

- `status` : `scheduled` (à venir), `completed` (passé), `cancelled`, `postponed`.
- `date` au format `AAAA-MM-JJ` ; `uiDay` et `uiPlace` sont les textes affichés.
- Le **prochain concert** affiché sur l'accueil est calculé **au moment du build** : un rebuild quotidien (5h UTC) le fait basculer tout seul une fois la date passée.
- Après le concert : passer `status` à `completed` et ajouter si besoin la playlist vidéo :
  `videoPlaylistUrl`, `videoPlaylistName`, `videoPlaylistTitle`.

### Photos du groupe — `src/data/group-photos.json`

Chaque photo a une miniature (`thumbnailImage`) et une grande version (`fullImage`) dans `public/images/group/`,
un `title` et un `alt` qui **décrivent réellement la photo** (lieu, date exacte).

### Contact booking — `src/data/contact.json`

Adresse e-mail et objet du mail de contact, utilisés partout sur le site.

### Membres du groupe

Deux endroits : la liste affichée dans `src/pages/groupe.astro` et les données structurées dans `src/data/schema.ts` (`members`).

### Mentions légales

`src/pages/mentions.astro` : mettre à jour **à la main** la constante `lastUpdated` quand le contenu change.

---

## Déploiement

**Rien à faire à la main** : tout passe par GitHub Actions (`.github/workflows/deploy-pages.yml`).

| Déclencheur | Build + déploiement | Signal IndexNow |
|---|---|---|
| Push / fusion sur `main` (hors fichiers `.md`) | ✅ | ✅ |
| Lancement manuel (onglet *Actions* → *Run workflow*) | ✅ | ✅ |
| Tous les jours à 5h UTC | ✅ | ❌ (IndexNow ne veut que les vraies mises à jour) |

- Secrets GitHub requis : `CLOUDFLARE_API_TOKEN` (permission *Cloudflare Pages: Edit*) et `CLOUDFLARE_ACCOUNT_ID`.
- Les modifications de fichiers Markdown seuls (`*.md`, comme ce README) ne déclenchent pas de déploiement.
- Si un run échoue sans qu'aucun job n'ait démarré (raté côté GitHub) : *Actions* → *Re-run jobs*.
- **Google** ne participe pas à IndexNow : le sitemap est soumis dans Google Search Console.

---

## Règles à respecter

### Façon de travailler

1. **Récupérer la dernière version avant tout** (`git pull`) : le dépôt local peut être en retard.
2. Travailler sur une **branche** (`feat/…`, `fix/…`, `docs/…`), jamais directement sur `main`.
3. `npm run build` doit passer, puis **tester en local** avec `npm run preview` avant de créer la PR.
4. Une PR par sujet, description en français. La fusion dans `main` met le site en ligne.
5. Messages de commit en français, qui expliquent le **pourquoi**.
6. Ne rien casser : vérifier visuellement ordinateur **et** mobile.

### URL et SEO

- **Toutes les URL internes finissent par un slash** : `/groupe/`, pas `/groupe`.
  Cloudflare Pages sert `/groupe/` et redirige `/groupe` (308) : liens, `canonicalPath` et sitemap doivent utiliser le slash.
- **Un seul `<h1>` par page** : sur l'accueil c'est le nom du groupe (dans `SiteHeader`), sur les autres pages c'est le titre de la page (`<h1 class="page-title">`).
- Chaque page passe à `BaseLayout` un `title`, une `description` et un `canonicalPath` qui lui sont propres.
- Pas de meta `keywords` (ignorée par Google).
- Les textes doivent rester **locaux et concrets** (Ain, Lyon, Auvergne-Rhône-Alpes, lieux joués) : « Nice Boys » est aussi le titre d'une chanson des Guns N' Roses, le site doit se positionner sur « tribute Guns N' Roses + région ».

### Données structurées (JSON-LD)

- Tout passe par `src/data/schema.ts` (`buildMusicGroupSchema()`, `buildMusicEventSchema()`) et le composant `<JsonLd slot="head" data={…} />`.
- **Jamais de données inventées ou fictives** (faux liens, faux membres, images inexistantes) : seulement les données réelles du site.
- Pas de chaîne YouTube dans `sameAs` tant que le groupe n'a pas sa propre chaîne (les vidéos actuelles sont sur une chaîne personnelle).

### Images

- Format léger : **WebP** pour les images du site, JPEG compressé pour les photos, PNG compressé pour les icônes.
- Toujours `alt` descriptif, `width` et `height` sur les `<img>`.
- Image de partage réseaux sociaux : `public/og-image.jpg` en 1200×630.

### PWA (installation + page hors ligne)

- `public/sw.js` **ne met en cache aucune page du site** (jamais de contenu périmé) : seulement `/offline.html` et le logo.
- Toute modification de `offline.html` ou de la liste précachée → **incrémenter `CACHE_NAME`** dans `sw.js`.
- Ne pas retirer `cleanResponse()` : Cloudflare redirige `/offline.html` vers `/offline`, et Chrome refuse d'afficher une réponse redirigée.
- Icônes : `android-chrome-*.png` (purpose `any`) et `maskable-*.png` (logo à 72 % sur fond noir) sont distinctes.
- `theme_color` du manifeste = `theme-color` du HTML (`#000000`).

### Fichiers à ne jamais supprimer

- `public/6e60b811cfbd97b394f7259d9e1b4cd3.txt` (clé IndexNow, son contenu = son nom sans `.txt`)
- `public/BingSiteAuth.xml`, `public/googlec8c5089c3155df10.html` et les balises de vérification dans `BaseLayout.astro`

---

## Changement de nom de domaine (le jour venu)

Remplacer `https://niceboys.pages.dev` dans :

- `astro.config.mjs` (`site`)
- `src/data/schema.ts` (`SITE_URL`)
- `src/layouts/BaseLayout.astro` (valeur de secours)
- `scripts/generate-sitemap.mjs` et `scripts/indexnow.mjs` (`SITE_URL`)
- `public/robots.txt` (ligne `Sitemap:`)
- `public/schema.json` (ancien fichier, non utilisé par les pages)

Puis : déclarer le domaine dans Cloudflare Pages, ajouter la nouvelle propriété dans Google Search Console et Bing Webmaster Tools,
et faire rediriger `niceboys.pages.dev` vers le nouveau domaine.

---

## Pour les assistants IA — résumé des consignes

- `git pull` d'abord ; branche dédiée ; `npm run build` ; laisser l'humain tester via `npm run preview` **avant** de créer la PR (sauf demande contraire explicite).
- Contenu = `src/data/*.json`. Ne pas dupliquer de contenu dans le code.
- URL internes avec slash final ; un seul `<h1>` par page ; `canonicalPath` propre à chaque page.
- JSON-LD uniquement via `src/data/schema.ts` + `JsonLd.astro`, avec des données réelles.
- Ne jamais mettre en cache les pages dans `sw.js` ; incrémenter `CACHE_NAME` si `offline.html` change ; garder `cleanResponse()`.
- Ne jamais supprimer la clé IndexNow ni les fichiers/balises de vérification ; ne jamais committer `pub/`.
- Ne jamais committer de secret (token Cloudflare, etc.) : ils vivent dans les secrets GitHub.
- Langue du site, des commits et des PR : **français**.
