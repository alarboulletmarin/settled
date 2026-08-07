/* ============================================================================
 * Les en-têtes de sécurité, et la preuve qu'ils ne cassent rien.
 *
 * L'app ne demande rien à l'extérieur : aucun `fetch`, aucune ressource tierce,
 * les fontes auto-hébergées. Une CSP `default-src 'self'` n'est donc pas une
 * gêne à contourner, c'est la **preuve technique** de l'argument du produit —
 * elle transforme « nous ne transmettons rien » en « le navigateur refuse toute
 * transmission », et elle tiendrait même si une dépendance npm était compromise.
 *
 * Deux choses vivent ici, et elles ne se séparent pas.
 *
 * **Le hash du script en ligne.** `index.html` porte un script anti-FOUC — le
 * miroir `localStorage` du thème, qui évite une frame en clair avant que la
 * base IndexedDB ne réponde. Une CSP sans `'unsafe-inline'` le refuse, sauf à
 * lui donner son empreinte `sha256`. Recopiée à la main, cette empreinte
 * devient fausse au premier caractère changé dans ce script — et l'app arrive
 * en production avec un thème qui clignote, ou pire, une page qui ne s'affiche
 * pas. Elle est donc **calculée**, depuis le fichier réellement servi, et
 * `npm run verify` échoue si celle du `vercel.json` commité a pris du retard.
 * C'est la règle de `licences.mjs` et de la version de l'app, appliquée ici.
 *
 * **L'audit.** Le risque réel d'une CSP n'est pas d'être trop faible : c'est de
 * partir en production et de casser un écran que personne n'a rouvert. Le
 * contrôle lit la politique telle qu'elle est écrite dans `vercel.json` — pas
 * une copie idéale qu'on garderait à côté — et l'oppose à `dist/`, c'est-à-dire
 * à ce qui est vraiment servi : chaque script, chaque feuille, chaque `url()`
 * du CSS, chaque icône du manifeste. Ce qu'une directive bloquerait est nommé,
 * avec la directive qui l'aurait bloqué.
 *
 * Deux pièges qu'il a trouvés le jour où il a été écrit, et qui disent
 * exactement pourquoi il existe : `@fontsource/geist-mono` embarque plusieurs
 * sous-ensembles en `data:` dans le CSS — `font-src 'self'` seul les aurait
 * fait disparaître —, et `navigator.clipboard.writeText` sert au bouton « copier
 * le schéma » — un `Permissions-Policy` refusant tout l'aurait éteint sans un
 * mot. Ni l'un ni l'autre ne se voit en relisant le code.
 *
 * Il lit `dist/`, donc il vient **après la construction**, comme la mesure de
 * taille : c'est la politique de ce qui est servi, et ce qui est servi n'existe
 * qu'une fois construit.
 *
 *   npm run build && npm run csp    met le hash à jour dans vercel.json
 *   npm run csp:check               échoue s'il a pris du retard, et audite
 * ==========================================================================*/

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const CONFIG = 'vercel.json'
const DIST = 'dist'

/* Les en-têtes qui ne dépendent de rien, et que l'audit exige de trouver. La
   CSP n'est pas dans cette liste : elle porte un hash, elle se compare
   autrement. */
const REQUIRED = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

/* Les API que `Permissions-Policy` gouverne, et le nom sous lequel il les
   désigne. La liste n'est pas exhaustive — elle couvre ce qu'un code de cette
   app pourrait raisonnablement se mettre à appeler, et sert à une seule chose :
   crier le jour où l'un de ces appels apparaît alors que l'en-tête le refuse.
   Les noms de propriété survivent à la minification, c'est ce qui rend la
   recherche possible sur le bundle plutôt que sur le source — les dépendances
   comptent autant que notre code. */
const GATED_APIS = [
  ['navigator.clipboard.readText', 'clipboard-read'],
  ['navigator.clipboard.writeText', 'clipboard-write'],
  ['navigator.geolocation', 'geolocation'],
  ['getUserMedia', 'camera'],
  ['getDisplayMedia', 'display-capture'],
  ['navigator.share', 'web-share'],
  ['navigator.bluetooth', 'bluetooth'],
  ['navigator.usb', 'usb'],
  ['navigator.serial', 'serial'],
  ['navigator.hid', 'hid'],
  ['requestFullscreen', 'fullscreen'],
  ['navigator.wakeLock', 'screen-wake-lock'],
  ['PaymentRequest', 'payment'],
  ['requestPictureInPicture', 'picture-in-picture'],
  ['requestMIDIAccess', 'midi'],
]

/* Ce qu'un `rel` fait charger, et la directive qui en décide. Ce qui n'y figure
   pas ne déclenche aucune requête — `canonical`, `alternate`, `author` — et n'a
   donc rien à prouver. */
const REL_DIRECTIVES = {
  stylesheet: 'style-src',
  modulepreload: 'script-src',
  icon: 'img-src',
  'shortcut icon': 'img-src',
  'apple-touch-icon': 'img-src',
  manifest: 'manifest-src',
}

/* La chaîne de repli de CSP niveau 3 : une directive absente délègue à la
   suivante, et `default-src` reçoit tout le reste. La reproduire ici évite de
   lire `img-src 'self'` dans une politique qui ne l'écrit pas — et donc de
   croire à un blocage qui n'a pas lieu. */
const FALLBACKS = {
  'script-src-elem': ['script-src', 'default-src'],
  'script-src-attr': ['script-src', 'default-src'],
  'style-src-elem': ['style-src', 'default-src'],
  'style-src-attr': ['style-src', 'default-src'],
  'script-src': ['default-src'],
  'style-src': ['default-src'],
  'img-src': ['default-src'],
  'font-src': ['default-src'],
  'connect-src': ['default-src'],
  'manifest-src': ['default-src'],
  'worker-src': ['default-src'],
  'frame-src': ['default-src'],
  'media-src': ['default-src'],
  'object-src': ['default-src'],
}

const FONT_EXTENSIONS = ['.woff2', '.woff', '.ttf', '.otf', '.eot']
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico']

// ---------------------------------------------------------------------------
// Lecture de ce qui est configuré, et de ce qui est servi
// ---------------------------------------------------------------------------

function readConfig() {
  const text = readFileSync(CONFIG, 'utf8')
  return { text, config: JSON.parse(text) }
}

/** La règle d'en-têtes qui porte la CSP, telle qu'elle est écrite. */
function securityRule(config) {
  for (const rule of config.headers ?? []) {
    const found = (rule.headers ?? []).find(
      (header) => header.key.toLowerCase() === 'content-security-policy',
    )
    if (found) return { rule, csp: found.value }
  }
  throw new Error(
    `Aucun en-tête « Content-Security-Policy » dans ${CONFIG}. ` +
      "C'est lui que ce script entretient : sans lui, il n'a rien à dire.",
  )
}

function headerValue(rule, key) {
  return (rule.headers ?? []).find((header) => header.key.toLowerCase() === key.toLowerCase())?.value
}

function distFile(name) {
  const path = join(DIST, name)
  if (!existsSync(path)) {
    throw new Error(`${path} est absent. Lance « npm run build » d'abord.`)
  }
  return readFileSync(path, 'utf8')
}

/** Les scripts en ligne du document servi, dans l'ordre où le navigateur les lit. */
function inlineScripts(html) {
  const scripts = []
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attributes, body] = match
    if (/\bsrc\s*=/i.test(attributes)) continue
    /* Le type ne fait pas de tri. Le bloc `application/ld+json` est une donnée
       que la spec n'exécute pas et n'inspecte donc pas — mais un hash inutile
       ne coûte rien, tandis qu'un hash manquant coûte un écran. La règle
       uniforme se relit aussi sans connaître ce coin de la spécification.
       Contrepartie assumée : le script bénit ce qu'il trouve. C'est le diff de
       `vercel.json` qui montre un hash nouveau, et c'est là qu'on le regarde. */
    scripts.push({ type: attribute(attributes, 'type') ?? 'javascript', body, hash: sha256(body) })
  }
  return scripts
}

function sha256(text) {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`
}

function attribute(attributes, name) {
  return new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attributes)?.[1]
}

// ---------------------------------------------------------------------------
// La politique, telle qu'elle est écrite, et ce qu'elle autorise
// ---------------------------------------------------------------------------

function parsePolicy(csp) {
  const policy = new Map()
  for (const part of csp.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/)
    if (name) policy.set(name.toLowerCase(), sources)
  }
  return policy
}

/** Les sources qui gouvernent une directive, repli compris. */
function sourcesFor(policy, directive) {
  if (policy.has(directive)) return policy.get(directive)
  for (const next of FALLBACKS[directive] ?? []) {
    if (policy.has(next)) return policy.get(next)
  }
  return null
}

/** Ce qu'une URL demande au navigateur : d'où elle vient décide qui l'autorise. */
function kindOf(url) {
  if (url.startsWith('data:')) return 'data'
  if (url.startsWith('blob:')) return 'blob'
  if (url.startsWith('javascript:')) return 'javascript'
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return 'remote'
  return 'self'
}

/** La directive qui décide du sort d'une URL, déduite de ce qu'elle désigne. */
function directiveForUrl(url) {
  const path = url.split(/[?#]/)[0].toLowerCase()
  if (path.startsWith('data:font/') || path.startsWith('data:application/font')) return 'font-src'
  if (path.startsWith('data:image/')) return 'img-src'
  if (FONT_EXTENSIONS.some((extension) => path.endsWith(extension))) return 'font-src'
  if (IMAGE_EXTENSIONS.some((extension) => path.endsWith(extension))) return 'img-src'
  if (path.endsWith('.css')) return 'style-src'
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'script-src'
  return 'default-src'
}

function permits(policy, directive, url) {
  const sources = sourcesFor(policy, directive)
  if (sources === null || sources.includes("'none'")) return false
  const kind = kindOf(url)
  if (kind === 'self') return sources.includes("'self'")
  if (kind === 'data') return sources.includes('data:')
  if (kind === 'blob') return sources.includes('blob:')
  return false
}

function permitsInline(policy, directive, hash) {
  const sources = sourcesFor(policy, directive)
  if (sources === null || sources.includes("'none'")) return false
  return sources.includes("'unsafe-inline'") || (hash !== undefined && sources.includes(hash))
}

// ---------------------------------------------------------------------------
// L'audit
// ---------------------------------------------------------------------------

/** Le balisage seul : les corps de script et de style ont leur propre examen,
    et leur prose déclencherait les recherches d'attributs à faux. */
function markupOnly(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2')
    .replace(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/gi, '$1$2')
}

function auditDocument(policy, findings) {
  const html = distFile('index.html')

  for (const script of inlineScripts(html)) {
    if (permitsInline(policy, 'script-src-elem', script.hash)) continue
    findings.push({
      où: `${DIST}/index.html`,
      quoi: `script en ligne (${script.type})`,
      directive: 'script-src',
      remède: `ajouter ${script.hash} — « npm run csp » le fait`,
    })
  }

  const markup = markupOnly(html)

  for (const match of markup.matchAll(/<script\b([^>]*)>/gi)) {
    const src = attribute(match[1], 'src')
    if (src !== undefined) check(policy, 'script-src', src, '<script src>', findings)
  }

  for (const match of markup.matchAll(/<link\b([^>]*)>/gi)) {
    const rel = attribute(match[1], 'rel')?.toLowerCase()
    const href = attribute(match[1], 'href')
    if (rel === undefined || href === undefined) continue
    /* `preconnect` et `dns-prefetch` n'appartiennent à aucune directive : le
       navigateur ouvre la connexion avant qu'il y ait quoi que ce soit à
       charger, et aucune CSP ne l'en empêche. Vers un tiers, c'est la visite
       elle-même qui est révélée — un constat, pas un blocage. */
    if (rel === 'preconnect' || rel === 'dns-prefetch') {
      if (kindOf(href) === 'remote') {
        findings.push({
          où: `${DIST}/index.html`,
          quoi: `<link rel="${rel}"> vers ${href}`,
          directive: '— aucune',
          remède: 'le retirer : il annonce la visite à un tiers, et la CSP ne le voit pas',
        })
      }
      continue
    }
    const directive = REL_DIRECTIVES[rel]
    if (directive !== undefined) check(policy, directive, href, `<link rel="${rel}">`, findings)
  }

  for (const match of markup.matchAll(/<(img|iframe)\b([^>]*)>/gi)) {
    const src = attribute(match[2], 'src')
    const directive = match[1].toLowerCase() === 'img' ? 'img-src' : 'frame-src'
    if (src !== undefined) check(policy, directive, src, `<${match[1]} src>`, findings)
  }

  if (/<style\b/i.test(html) && !permitsInline(policy, 'style-src-elem')) {
    findings.push({
      où: `${DIST}/index.html`,
      quoi: 'feuille de style en ligne (<style>)',
      directive: 'style-src',
      remède: "la sortir dans un fichier, ou lui donner son hash",
    })
  }

  if (/\sstyle\s*=\s*"/i.test(markup) && !permitsInline(policy, 'style-src-attr')) {
    findings.push({
      où: `${DIST}/index.html`,
      quoi: 'attribut style="…"',
      directive: "style-src-attr (repli sur style-src)",
      remède: "passer par une classe, ou autoriser 'unsafe-inline' sur style-src",
    })
  }

  for (const match of markup.matchAll(/\son([a-z]+)\s*=\s*"/gi)) {
    findings.push({
      où: `${DIST}/index.html`,
      quoi: `gestionnaire en ligne on${match[1]}="…"`,
      directive: 'script-src-attr (repli sur script-src)',
      remède: 'le poser en JavaScript — un gestionnaire en ligne ne se hache pas utilement',
    })
  }

  if (/(href|src)\s*=\s*"javascript:/i.test(markup)) {
    findings.push({
      où: `${DIST}/index.html`,
      quoi: 'URL javascript:',
      directive: 'script-src',
      remède: 'la remplacer par un gestionnaire posé en JavaScript',
    })
  }
}

function auditStylesheets(policy, findings) {
  for (const file of assetFiles('.css')) {
    const css = readFileSync(join(DIST, file), 'utf8')
    const seen = new Set()
    for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
      const url = match[2].trim()
      /* Les `data:` de fonte reviennent des dizaines de fois, et une empreinte
         base64 dans un message d'erreur ne rend service à personne : un constat
         par famille suffit à dire ce qui manque. */
      const key = kindOf(url) === 'data' ? url.replace(/^(data:[^;,]*).*$/, '$1') : url
      if (seen.has(key)) continue
      seen.add(key)
      check(policy, directiveForUrl(key), key, 'url()', findings, file)
    }
  }
}

function auditManifest(policy, findings) {
  const manifest = JSON.parse(distFile('manifest.webmanifest'))
  const images = [
    ...(manifest.icons ?? []),
    ...(manifest.screenshots ?? []),
    ...(manifest.shortcuts ?? []).flatMap((shortcut) => shortcut.icons ?? []),
  ]
  for (const image of images) {
    check(policy, 'img-src', image.src, 'image du manifeste', findings, 'manifest.webmanifest')
  }
}

/* Le service worker reçoit la même politique que les pages — la règle
   `/(.*)` de `vercel.json` le couvre —, et c'est *sa* CSP qui gouverne ses
   `fetch` : sans `connect-src 'self'`, il précacherait dans le vide et l'app
   cesserait de fonctionner hors ligne sans que rien ne le dise. Le reste de ce
   qu'il précache est déjà vérifié ailleurs : ce sont les fichiers de `dist/`. */
function auditServiceWorker(policy, findings) {
  const sources = sourcesFor(policy, 'connect-src')
  if (sources === null || !sources.includes("'self'")) {
    findings.push({
      où: `${DIST}/sw.js`,
      quoi: 'les requêtes de précache du service worker',
      directive: 'connect-src',
      remède: "autoriser 'self' — sans quoi le mode hors ligne s'éteint en silence",
    })
  }
  /* Les entrées elles-mêmes se lisent sous `connect-src` et non sous la
     directive de leur type : le service worker les récupère par `fetch`, c'est
     ce chemin-là qu'une directive fermerait. */
  for (const match of distFile('sw.js').matchAll(/\burl\s*:\s*"([^"]+)"/g)) {
    check(policy, 'connect-src', match[1], 'entrée de précache', findings, 'sw.js')
  }
}

/** Les API que le bundle appelle vraiment, opposées à ce que l'en-tête refuse. */
function auditPermissions(permissions, findings) {
  const allowed = new Map(
    permissions.split(',').map((part) => {
      const [feature, list] = part.trim().split('=')
      return [feature, (list ?? '()').replace(/[()]/g, '').trim()]
    }),
  )
  const code = [...assetFiles('.js'), 'sw.js']
    .map((file) => readFileSync(join(DIST, file), 'utf8'))
    .join('\n')

  for (const [api, feature] of GATED_APIS) {
    if (!code.includes(api)) continue
    if (allowed.get(feature) !== '') continue
    findings.push({
      où: 'le code servi',
      quoi: `${api}(), que l'app appelle`,
      directive: `Permissions-Policy: ${feature}=()`,
      remède: `passer à ${feature}=(self), ou retirer l'appel`,
    })
  }
}

function check(policy, directive, url, quoi, findings, où = 'index.html') {
  if (kindOf(url) === 'remote') {
    findings.push({
      où: `${DIST}/${où}`,
      quoi: `${quoi} vers ${url}`,
      directive,
      remède: "héberger la ressource, ou décider ici que l'app dépend d'un tiers",
    })
    return
  }
  if (permits(policy, directive, url)) return
  findings.push({
    où: `${DIST}/${où}`,
    quoi: `${quoi} ${url}`,
    directive,
    remède: `autoriser cette source sur ${directive}`,
  })
}

function assetFiles(extension) {
  const directory = join(DIST, 'assets')
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((name) => name.endsWith(extension))
    .map((name) => `assets/${name}`)
}

// ---------------------------------------------------------------------------
// Le hash, et sa mise à jour
// ---------------------------------------------------------------------------

/** La politique attendue : celle qui est écrite, ses hashes recalculés. */
function withFreshHashes(csp, hashes) {
  return csp
    .split(';')
    .map((part) => {
      const [name, ...sources] = part.trim().split(/\s+/)
      if (name.toLowerCase() !== 'script-src') return part.trim().replace(/\s+/g, ' ')
      const kept = sources.filter((source) => !source.startsWith("'sha256-"))
      return [name, ...kept, ...hashes].join(' ')
    })
    .filter(Boolean)
    .join('; ')
}

// ---------------------------------------------------------------------------

const write = !process.argv.includes('--check')
const { text, config } = readConfig()
const { rule, csp } = securityRule(config)
const hashes = inlineScripts(distFile('index.html')).map((script) => script.hash)
const expected = withFreshHashes(csp, hashes)

if (csp !== expected) {
  if (!write) {
    console.error(
      `La CSP de ${CONFIG} n'est plus celle du document servi.\n` +
        'Lance « npm run build && npm run csp » et commite le résultat.\n\n' +
        `  écrite :  ${csp}\n  attendue : ${expected}`,
    )
    process.exit(1)
  }
  /* Un remplacement textuel, et non une réécriture du JSON : `vercel.json`
     reste un fichier qu'on lit et qu'on modifie à la main — seuls les hashes
     lui viennent d'ici. La fonction de remplacement évite que `$&` et ses
     cousins soient interprétés dans la valeur. */
  const fresh = JSON.stringify(expected)
  writeFileSync(CONFIG, text.replace(JSON.stringify(csp), () => fresh))
  console.log(`${CONFIG} — hash mis à jour :\n  ${hashes.join('\n  ')}\n`)
} else if (write) {
  console.log(`${CONFIG} — hash déjà à jour.\n`)
}

const policy = parsePolicy(expected)
const findings = []

for (const [key, value] of Object.entries(REQUIRED)) {
  const actual = headerValue(rule, key)
  if (actual !== value) {
    findings.push({
      où: CONFIG,
      quoi: actual === undefined ? `en-tête ${key} absent` : `${key}: ${actual}`,
      directive: '—',
      remède: `le poser à « ${value} »`,
    })
  }
}

const permissions = headerValue(rule, 'Permissions-Policy')
if (permissions === undefined) {
  findings.push({
    où: CONFIG,
    quoi: 'en-tête Permissions-Policy absent',
    directive: '—',
    remède: "refuser les capacités que l'app ne demande pas",
  })
}

if (!(sourcesFor(policy, 'frame-ancestors') ?? []).includes("'none'")) {
  findings.push({
    où: CONFIG,
    quoi: "frame-ancestors n'interdit pas la mise en cadre",
    directive: 'frame-ancestors',
    remède: "la poser à 'none' — l'app n'a aucune raison d'être encadrée",
  })
}

/* Une politique qui s'ouvre en grand ne casse rien, et c'est bien le problème :
   elle passerait l'audit sans qu'on le remarque. */
for (const [directive, sources] of policy) {
  for (const source of sources) {
    if (["'unsafe-eval'", "'unsafe-inline'", '*', 'https:', 'http:', 'data:'].includes(source)) {
      if (directive === 'style-src' && source === "'unsafe-inline'") continue
      if (directive === 'font-src' && source === 'data:') continue
      findings.push({
        où: CONFIG,
        quoi: `${directive} autorise ${source}`,
        directive,
        remède: "restreindre, ou inscrire l'exception ici avec sa raison",
      })
    }
  }
}

auditDocument(policy, findings)
auditStylesheets(policy, findings)
auditManifest(policy, findings)
auditServiceWorker(policy, findings)
if (permissions !== undefined) auditPermissions(permissions, findings)

console.log('La politique servie :\n')
for (const [directive, sources] of policy) {
  console.log(`  ${directive} ${sources.join(' ')}`)
}
console.log('')

if (findings.length > 0) {
  console.error(
    `${findings.length} chose(s) que les en-têtes casseraient, ou laisseraient passer :\n`,
  )
  for (const finding of findings) {
    console.error(`  ${finding.quoi}`)
    console.error(`    dans      ${finding.où}`)
    console.error(`    directive ${finding.directive}`)
    console.error(`    remède    ${finding.remède}\n`)
  }
  process.exit(1)
}

console.log(
  'Rien de ce qui est servi ne tombe sous une directive : ' +
    `${String(hashes.length)} script(s) en ligne haché(s), le document, les feuilles, ` +
    'le manifeste et le service worker passent la politique.',
)
