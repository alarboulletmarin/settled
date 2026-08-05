import { describe, expect, it } from 'vitest'
import { defaultCategories, defaultFamilies } from './defaults'
import { CURRENT_SCHEMA_VERSION } from './schema'
import { SCHEMA_FILENAME, schemaDocument } from './schemaDoc'
import { parseImport, serializeData } from './transfer'

const doc = schemaDocument()

/** Le bloc ```json du document — celui qu'un lecteur copiera en premier. */
function minimalExample(): string {
  const match = /```json\n([\s\S]*?)\n```/.exec(doc)
  expect(match).not.toBeNull()
  return match![1]!
}

describe('schemaDocument', () => {
  it('annonce la version de schéma courante', () => {
    expect(doc).toContain(`Version de schéma : **${String(CURRENT_SCHEMA_VERSION)}**`)
  })

  it('porte le nom de fichier sous lequel il se télécharge', () => {
    expect(SCHEMA_FILENAME).toBe('tout-compte-fait-schema.md')
  })

  /* Le bloc de types est le source de `domain/types.ts`, embarqué par `?raw` :
     il ne peut pas dériver du modèle. Le test vérifie qu'il est bien arrivé, et
     que chaque clé du document y figure — un champ ajouté au modèle sans être
     décrit ici ne passerait pas. */
  it('embarque le source des types, sans ses imports', () => {
    expect(doc).toContain('export type Data = {')
    expect(doc).not.toContain("from './money'")
    expect(doc).not.toContain("from './date'")
  })

  it('décrit chacune des dix clés du document', () => {
    for (const key of [
      'schemaVersion',
      'household',
      'families',
      'categories',
      'recurrences',
      'entries',
      'debts',
      'advances',
      'months',
      'settings',
    ]) {
      expect(doc).toContain(key)
    }
  })

  it('redonne les trois primitives que les types empruntent ailleurs', () => {
    expect(doc).toContain('type Money = number')
    expect(doc).toContain('type ISODate = string')
    expect(doc).toContain('type YearMonth = string')
  })

  /* Le catalogue est lu sur `defaults.ts` : une catégorie ajoutée au jeu par
     défaut apparaît ici sans qu'on y touche, et son identifiant est ce qu'un
     assistant doit réutiliser plutôt que d'en inventer un. */
  it('liste chaque famille du catalogue par défaut, avec sa nature', () => {
    for (const family of defaultFamilies()) {
      expect(doc).toContain(`### ${family.label} — \`${family.id}\``)
      expect(doc).toContain(`Nature \`${family.kind}\``)
    }
  })

  it('liste chaque catégorie du catalogue par défaut, avec son identifiant', () => {
    for (const category of defaultCategories()) {
      expect(doc).toContain(`| \`${category.id}\` | ${category.label} |`)
    }
  })

  it('dit les règles qu’aucun type n’exprime', () => {
    expect(doc).toContain('centimes')
    expect(doc).toContain('points de base')
    expect(doc).toContain('`months[]`')
    expect(doc).toContain('`Advance.memberId` est obligatoire')
  })

  /* Le document embarque le source des types, réservés compris : sans cette
     règle, il enseignait trois champs sans effet comme s'ils réglaient quelque
     chose — exactement l'erreur qu'il existe pour éviter chez son lecteur. */
  it('annonce les champs réservés plutôt que de les laisser passer pour des réglages', () => {
    for (const field of ['`Category.icon`', '`MonthState.closed`', '`settings.monthStartsOn`']) {
      expect(doc).toContain(field)
    }
    expect(doc).toContain('réservés et sans effet')
  })
})

describe('l’exemple minimal du document', () => {
  /* C'est le seul garde-fou possible sur un littéral, et il attrape la faute qui
     compte : un exemple que l'app refuserait. Quelqu'un le copiera tel quel. */
  it('s’importe sans migration', () => {
    const result = parseImport(minimalExample())
    expect(result.from).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.migrated).toBe(false)
  })

  it('traverse l’import sans rien perdre', () => {
    const once = parseImport(minimalExample()).data
    const twice = parseImport(serializeData(once)).data
    expect(twice).toEqual(once)
  })

  it('ne cite que des catégories et des membres qui existent', () => {
    const { data } = parseImport(minimalExample())
    const families = new Set(data.families.map((f) => f.id))
    const categories = new Set(data.categories.map((c) => c.id))
    const members = new Set(data.household.members.map((m) => m.id))
    const recurrences = new Set(data.recurrences.map((r) => r.id))

    for (const category of data.categories) expect(families).toContain(category.familyId)
    for (const recurrence of data.recurrences) {
      expect(categories).toContain(recurrence.categoryId)
      if (recurrence.memberId !== undefined) expect(members).toContain(recurrence.memberId)
    }
    for (const entry of data.entries) {
      expect(categories).toContain(entry.categoryId)
      if (entry.memberId !== undefined) expect(members).toContain(entry.memberId)
      if (entry.recurrenceId !== undefined) expect(recurrences).toContain(entry.recurrenceId)
    }
  })

  /* Le prorata est ce que le foyer vient chercher en premier, et il ne se
     calcule qu'à deux revenus lisibles : l'exemple minimal doit donc en poser
     deux, sans quoi il enseigne un document que l'app affiche à moitié. */
  it('pose un revenu par personne, pour que la répartition existe', () => {
    const { data } = parseImport(minimalExample())
    for (const member of data.household.members) {
      const income = data.recurrences.filter(
        (r) => r.memberId === member.id && r.direction === 'in',
      )
      expect(income.length).toBeGreaterThan(0)
    }
  })
})
