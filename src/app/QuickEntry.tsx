import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fr } from '@/i18n/fr'
import { cn } from '@/lib/cn'
import { Button } from '@/ui/Button'
import { Plus } from '@/ui/Icons'
import { useHotkeys } from '@/ui/useHotkeys'
import { entryNewPath, isFocusScreen } from './routes'

/**
 * Le geste le plus fréquent de l'app, à portée de pouce et à tout moment.
 *
 * Les trois portes de saisie vivaient en tête de l'écran du mois, dans le flux :
 * elles défilaient avec la page, et disparaissaient tout à fait quand le mois
 * était vide, où l'`EmptyState` prend le relais. Sur un téléphone, saisir une
 * ligne demandait donc de remonter d'abord. Au clavier, « n » le faisait déjà
 * depuis n'importe où ; au doigt, rien.
 *
 * **Trois portes et non une.** L'écran du mois pose la règle : « les deux sens
 * sont deux boutons, jamais un seul » — passer par « Ajouter une dépense » pour
 * saisir un salaire obligeait à découvrir, une fois le formulaire ouvert, une
 * bascule dont rien n'annonçait l'existence. Un bouton flottant unique
 * rétablirait exactement ce qu'elle corrige. Il se déplie donc, et garde les
 * trois portes dans l'ordre de l'écran du mois.
 *
 * **Pas une feuille modale.** `ui/Sheet` sert à ce pour quoi une feuille est
 * faite — une explication qu'on ouvre et qu'on referme sans quitter des yeux ce
 * qu'elle explique. Ici il n'y a rien à lire : trois boutons, au-dessus de
 * celui qu'on vient de toucher, là où le pouce est déjà.
 *
 * **Ni sur un écran de saisie, ni au-delà de 1024px.** La première garde est
 * celle du raccourci « n », mot pour mot : partir créer une dépense par-dessus
 * celle qu'on est en train d'écrire contourne la garde de brouillon, qui ne
 * surveille que les deux boutons de sortie. La seconde tient à ce qu'il n'y a
 * plus rien à régler au-delà — la rangée en flux de l'écran du mois y reste, et
 * elle est à l'écran.
 */
export function QuickEntry() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const doorsRef = useRef<HTMLDivElement>(null)

  /* Le focus part sur la première porte à l'ouverture — sans quoi la tabulation
     repartirait du début du document, alors que ce qui vient d'apparaître est
     juste au-dessus du doigt. Il revient au déclencheur à la fermeture, parce
     que c'est de là qu'on vient et que le bouton est resté là.
     Cherché dans le groupe plutôt que posé sur le premier bouton : `Button` ne
     prend pas de `ref`, et lui en ajouter une pour un seul appelant élargirait
     son contrat pour rien. */
  useEffect(() => {
    if (open) doorsRef.current?.querySelector('button')?.focus()
  }, [open])

  const close = (): void => {
    setOpen(false)
    trigger.current?.focus()
  }

  /* Refermer ce qu'on vient d'ouvrir, la troisième touche de l'app. Enregistrée
     seulement quand il y a quelque chose à refermer : `useHotkeys` appelle
     `preventDefault` sur toute touche qu'il connaît, et un Échap intercepté en
     permanence retirerait la sienne à qui d'autre le voudrait. */
  useHotkeys({ Escape: open ? close : undefined })

  /* Changer d'écran referme les portes. Le composant vit dans la coquille et ne
     se démonte jamais : sans ça, l'état survivrait à la navigation, et revenir
     au mois — par le bouton « retour » du navigateur, par exemple, qui contourne
     tout ce qui est écrit ici — rouvrirait trois boutons que personne n'a
     redemandés.
     Ajusté au rendu et non dans un effet : c'est la forme que React donne à un
     état qui doit se remettre à zéro quand une valeur change, et elle évite le
     rendu de trop que l'effet imposerait — celui où les portes sont encore
     ouvertes sur l'écran suivant. */
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  if (isFocusScreen(pathname)) return null

  const create = (path: string): void => {
    setOpen(false)
    void navigate(path)
  }

  const doors = [
    { label: fr.entry.newOut, path: entryNewPath({ direction: 'out' }), variant: 'primary' as const },
    { label: fr.entry.newIn, path: entryNewPath({ direction: 'in' }), variant: 'secondary' as const },
    {
      label: fr.entry.newSaving,
      path: entryNewPath({ direction: 'out', saving: true }),
      variant: 'secondary' as const,
    },
  ]

  return (
    <>
      {/* Le calque ne noircit rien : les trois boutons se posent sur le coin
          bas-droit de la page, pas sur ce qu'on lisait. Il n'est là que pour
          rendre au reste de l'écran son geste le plus évident — toucher à côté
          referme. */}
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30"
          onClick={() => {
            setOpen(false)
          }}
        />
      )}

      {/* Au-dessus de la barre d'onglets (56px plus l'indicateur d'accueil), et
          sous le bandeau de mise à jour (`z-50`) : celui-ci est rare, il porte
          une décision, et un bouton qui lui passerait devant en cacherait la
          moitié. */}
      <div
        className={cn(
          'fixed right-4 z-40 flex flex-col items-end gap-2 lg:hidden',
          'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
        )}
      >
        {/* `items-stretch` et non `items-end` : trois boutons dimensionnés
              chacun sur son libellé alignent leur bord droit et font un
              escalier à gauche, ce qui les donne à lire comme trois objets
              empilés plutôt que comme les trois portes d'un même geste. Le
              groupe est déjà en largeur de contenu — son parent est
              `items-end` —, donc sa largeur *est* celle du plus large, et
              l'étirement n'a rien à imposer de plus.

              Pas de `flex-1`/`basis-0` comme au pied de `Sheet` : là-bas la
              largeur est donnée et les actions se la partagent, ici c'est le
              contenu qui la fixe. Et le contenu de chaque bouton reste centré,
              donc les « + » ne s'alignent pas tout à fait — les décaler
              demanderait de défaire le `justify-center` de `Button`, que `cn`
              ne sait pas fusionner : la classe ajoutée ne remplacerait pas
              l'autre, elle s'ajouterait, et c'est l'ordre du CSS produit qui
              trancherait. Un demi-écart de libellé ne vaut pas ce silence-là. */}
        {open && (
          <div
            ref={doorsRef}
            id="portes-de-saisie"
            role="group"
            aria-label={fr.shell.quickEntryLabel}
            className="flex flex-col items-stretch gap-2"
          >
            {doors.map((door) => (
              <Button
                key={door.path}
                variant={door.variant}
                className="shadow-tile"
                onClick={() => {
                  create(door.path)
                }}
              >
                <Plus size={18} />
                {door.label}
              </Button>
            ))}
          </div>
        )}

        {/* Le glyphe pivote plutôt que d'être remplacé par une croix : c'est le
            même bouton, et un `+` qui devient `×` sous le doigt dit mieux qu'il
            se referme que deux icônes qui se succèdent. Le nom accessible, lui,
            change pour de bon — il dit ce que le prochain appui fait. */}
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          {...(open ? { 'aria-controls': 'portes-de-saisie' } : {})}
          aria-label={open ? fr.shell.quickEntryClose : fr.shell.quickEntry}
          onClick={() => {
            setOpen((previous) => !previous)
          }}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg',
            /* `rotate` et non `transform` : Tailwind 4 pose `rotate-45` sur la
               propriété `rotate`, et une transition déclarée sur `transform` ne
               la voit pas — le glyphe basculait d'un coup. Vérifié en lisant le
               style calculé, pas en relisant la classe. */
            'shadow-tile transition-[rotate,filter] duration-[var(--dur)] ease-ds',
            'hover:brightness-95 active:brightness-90',
            open && 'rotate-45',
          )}
        >
          <Plus size={24} />
        </button>
      </div>
    </>
  )
}
