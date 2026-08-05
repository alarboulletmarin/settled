/* ============================================================================
 * Les licences de ce qui voyage dans l'app publiée.
 *
 * Six des douze paquets sont sous MIT, un sous ISC, et **deux sous SIL Open
 * Font License 1.1** — Archivo et Geist Mono. L'OFL n'est pas la licence de ce
 * dépôt, et elle pose une condition que MIT ne pose pas dans les mêmes termes :
 * le logiciel de fonte, modifié ou non, se distribue **avec le texte de sa
 * licence et sa notice de copyright**. Or les `.woff2` sont empaquetés dans
 * `dist/assets/` et servis à chaque visite. Sans ce fichier-là, l'app
 * distribuait deux fontes sans leur licence.
 *
 * Il est **produit, jamais écrit à la main** : une seconde liste de licences
 * recopiée à côté du `node_modules` divergerait au premier `npm update`, et
 * c'est celle qu'on ne relit jamais qui resterait fausse. C'est la règle du
 * `schemaDoc` et de la version de l'app, appliquée ici.
 *
 * La sortie vit dans `public/`, donc Vite la copie dans `dist/` : elle voyage
 * avec les fontes qu'elle couvre, ce qui est exactement ce que l'OFL demande.
 * En `.txt` et non en `.md` : un navigateur affiche l'un et télécharge l'autre,
 * et une licence qu'il faut télécharger pour lire n'est pas mise à disposition.
 *
 * `--check` rejoue la génération sans écrire et échoue si le fichier commité a
 * pris du retard. C'est ce que `npm run verify` appelle : le jour où une
 * dépendance change de licence, la porte de sortie crie avant que le dépôt ne
 * mente.
 * ==========================================================================*/

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'public/licences-tierces.txt'

/* Le nom du fichier de licence n'est normalisé nulle part : chaque paquet
   choisit sa casse et son extension. On les essaie dans l'ordre du plus
   courant, et on échoue bruyamment plutôt que d'omettre une notice. */
const LICENSE_FILES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'license', 'license.md']

/**
 * Les paquets qui voyagent vraiment.
 *
 * Les `dependencies` du manifeste et, transitivement, les leurs : `react-dom`
 * embarque `scheduler`, `react-router` embarque `cookie`. Les
 * `devDependencies` sont exclues — elles construisent l'app, elles ne partent
 * pas avec elle, et les inscrire ferait passer pour distribué ce qui ne l'est
 * pas.
 */
function shippedPackages() {
  const root = JSON.parse(readFileSync('package.json', 'utf8'))
  const found = new Map()

  const visit = (name) => {
    if (found.has(name)) return
    const dir = join('node_modules', name)
    if (!existsSync(join(dir, 'package.json'))) {
      throw new Error(`Paquet absent de node_modules : ${name}. Lance « npm ci » d'abord.`)
    }
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    found.set(name, { dir, manifest })
    for (const dependency of Object.keys(manifest.dependencies ?? {})) visit(dependency)
  }

  for (const dependency of Object.keys(root.dependencies ?? {})) visit(dependency)
  return [...found.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'))
}

function licenseTextOf(dir, name) {
  for (const file of LICENSE_FILES) {
    const path = join(dir, file)
    if (existsSync(path)) return readFileSync(path, 'utf8').trimEnd()
  }
  /* Aucun repli : une notice manquante est le problème que ce fichier existe
     pour régler, et la remplacer par « voir le paquet » ne la rend pas. */
  throw new Error(`Aucun fichier de licence trouvé pour ${name} dans ${dir}.`)
}

const RULE = '='.repeat(78)

function render(packages) {
  const lines = [
    'Licences des composants tiers — Tout compte fait',
    RULE,
    '',
    "Tout compte fait est publié sous licence MIT (voir le fichier LICENSE du",
    "dépôt). Les composants ci-dessous sont l'œuvre de tiers, portent leur propre",
    'licence, et voyagent dans la version publiée de l’app : leur code ou leurs',
    'fichiers de fonte sont servis au navigateur de qui l’ouvre.',
    '',
    'Deux d’entre eux — les fontes Archivo et Geist Mono — sont sous SIL Open Font',
    'License 1.1, qui demande que le logiciel de fonte soit distribué avec sa',
    'licence et sa notice de copyright. C’est la raison première de ce fichier.',
    '',
    'Il est produit depuis « node_modules » par « npm run licences », jamais écrit',
    'à la main, et « npm run verify » échoue s’il a pris du retard.',
    '',
    RULE,
    '',
  ]

  for (const [name, { manifest }] of packages) {
    lines.push(`  ${name} ${manifest.version} — ${manifest.license ?? 'licence non déclarée'}`)
  }

  lines.push('')
  for (const [name, { dir, manifest }] of packages) {
    lines.push(
      '',
      RULE,
      `${name} ${manifest.version}`,
      `Licence déclarée : ${manifest.license ?? 'non déclarée'}`,
      ...(typeof manifest.homepage === 'string' ? [`Page du projet : ${manifest.homepage}`] : []),
      RULE,
      '',
      licenseTextOf(dir, name),
      '',
    )
  }

  return `${lines.join('\n').trimEnd()}\n`
}

const expected = render(shippedPackages())

if (process.argv.includes('--check')) {
  const actual = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (actual !== expected) {
    console.error(
      `${OUT} n’est plus à jour. Lance « npm run licences » et commite le résultat.`,
    )
    process.exit(1)
  }
  console.log(`${OUT} — à jour.`)
} else {
  writeFileSync(OUT, expected)
  console.log(`${OUT} — écrit.`)
}
