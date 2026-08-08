import { type ReactNode, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ExportReminder } from '@/features/settings/ExportReminder'
import { fr } from '@/i18n/fr'
import { useHouseholdName } from '@/store/selectors'
import { ScreenEntryProvider } from '@/ui/ScreenEntryProvider'
import { ScreenTitleProvider } from '@/ui/ScreenTitleProvider'
import { useHotkeys } from '@/ui/useHotkeys'
import { Sidebar, TabBar } from './Nav'
import { QuickEntry } from './QuickEntry'
import { StorageAlert } from './StorageAlert'
import { entryNewPath, isFocusScreen } from './routes'

/** Coquille de l'app : navigation et gabarit. Aucune règle métier ici. */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const householdName = useHouseholdName()
  const navigate = useNavigate()
  const focus = isFocusScreen(pathname)

  /* Le geste le plus fréquent de l'app, sur une touche. Pas sur un écran de
     saisie : « n » y partirait créer une dépense par-dessus celle qu'on est en
     train d'écrire, et il contournerait la garde de brouillon, qui ne surveille
     que les deux boutons de sortie. */
  useHotkeys({
    n: focus
      ? undefined
      : () => {
          void navigate(entryNewPath({ direction: 'out' }))
        },
  })

  /* Le focus part au contenu à chaque changement d'écran.

     Changer d'URL ici ne recharge rien : le focus restait donc sur le lien de
     navigation qu'on venait d'activer, à tabuler dans un menu pendant que
     l'écran, lui, avait changé — et le lecteur d'écran n'avait aucune raison de
     lire quoi que ce soit. Le titre se dit en parallèle (`ScreenTitleProvider`),
     et les deux gestes ne se remplacent pas : l'un sert la voix, l'autre le
     clavier.

     Trois gardes. Le premier affichage n'en est pas un — comparer le chemin
     précédent le dit, et survit au double montage du `StrictMode`, ce qu'un
     simple drapeau ne fait pas. Un écran qui a posé son propre focus le garde :
     le premier champ d'une saisie est exactement là où l'on veut être, et le
     renvoyer en haut annulerait le geste qu'on vient de faire. Et le focus est
     programmatique : `:focus-visible` ne s'y applique pas, l'anneau du DS ne se
     dessine donc pas autour de la page entière. */
  const main = useRef<HTMLElement>(null)
  const previous = useRef(pathname)

  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname

    const node = main.current
    if (node === null || node.contains(document.activeElement)) return
    node.focus()
  }, [pathname])

  return (
    <ScreenTitleProvider>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-input focus:bg-surface focus:px-4 focus:py-2"
      >
        {fr.a11y.skipToContent}
      </a>

      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar householdName={householdName} />
        <main
          id="contenu"
          key={pathname}
          ref={main}
          /* Focalisable au script, jamais à la tabulation : le contenu n'est pas
             une étape du parcours clavier, c'est là qu'on le dépose. */
          tabIndex={-1}
          /* Le cadre bas se déduit de ce qu'il doit dégager, et non d'un
             nombre rond : la barre d'onglets, la marge du bouton flottant, le
             disque, et un blanc sous le contenu. Il valait 96px quand le disque
             monte à 129 au-dessus du bord — les trente-trois derniers pixels du
             contenu passaient dessous, au coin bas-droit, et c'est là que
             tombent les montants d'une liste et la poignée d'un repli. Mesuré
             sur l'historique, mais le défaut n'était pas le sien : tout écran
             qui va jusqu'en bas le portait. Écrit avec les jetons du bouton
             pour que les deux ne puissent plus diverger. */
          className="view-enter min-w-0 flex-1 px-4 pt-4 pb-[calc(var(--nav-h)+1rem+3.5rem+1rem+env(safe-area-inset-bottom))] md:px-8 md:pt-8 lg:pb-10"
        >
          {/* Celui-ci ne connaît pas `isFocusScreen` : un écran de saisie est
              précisément l'endroit où l'on est en train de perdre du travail. */}
          <StorageAlert />
          {/* Le rappel d'export, lui, ne s'intercale pas au-dessus d'une saisie
              en cours ni d'une fiche : ces écrans-là n'ont qu'une chose à
              montrer, et un export peut attendre la fin de la phrase. */}
          {!focus && <ExportReminder />}
          {/* Sous `key={pathname}` : c'est cette clé qui fait d'un changement
              d'URL une arrivée, et le marqueur d'arrivée doit repartir avec
              elle. Il n'englobe pas les deux bandeaux ci-dessus, qui ne
              dépendent pas de l'écran. */}
          <ScreenEntryProvider>{children}</ScreenEntryProvider>
        </main>
      </div>

      <TabBar />
      {/* Après la barre d'onglets, qu'il surplombe : c'est le même geste au
          doigt que le raccourci « n » au clavier, et il porte la même garde. */}
      <QuickEntry />
    </ScreenTitleProvider>
  )
}
