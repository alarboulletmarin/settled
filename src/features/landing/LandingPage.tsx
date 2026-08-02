import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppFooter } from '@/app/AppFooter'
import { ONBOARDING_PATH } from '@/app/routes'
import { fr } from '@/i18n/fr'
import { useStore } from '@/store/store'
import { ExampleControl } from '@/features/settings/ExampleControl'
import { ImportControl } from '@/features/settings/ImportControl'
import { SchemaControl } from '@/features/settings/SchemaControl'
import { Button } from '@/ui/Button'
import { Eyebrow } from '@/ui/Eyebrow'
import { DataIcon, RecurrencesIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { LandingTiles } from './LandingTiles'

/**
 * La première page de l'app, et sa vitrine.
 *
 * Elle existe parce que l'écran d'arrivée était la question « Comment s'appelle
 * ton foyer ? » : on demandait de répondre avant d'avoir dit ce que l'app suit,
 * où vont les données, ni pourquoi elle vaut la peine d'être remplie.
 *
 * Elle vit au-dessus du gate, à une URL stable, et répond donc dans les deux
 * états — c'est ce qui permet de la lier depuis le dépôt, et d'y revenir depuis
 * « à propos ». Ce qu'elle propose, lui, dépend de l'état : les trois portes
 * remplacent des données, et n'ont rien à faire devant quelqu'un qui en a.
 */
export function LandingPage() {
  const status = useStore((s) => s.status)
  const navigate = useNavigate()

  /* Ouverte les mains vides, elle s'efface dès qu'il y a quelque chose à
     montrer : c'est ce que « charger l'exemple » promet, et `replaceData`
     bascule le statut sans toucher à l'URL — sans ça, le clic n'aurait produit
     à l'écran que la disparition du bouton qu'on vient de toucher.
     Ouverte volontairement depuis « à propos », elle reste : on ne renvoie pas
     quelqu'un d'où il vient.
     Le drapeau se lève dans l'effet et non au premier rendu : cette page vit
     au-dessus du gate, donc elle monte pendant que `hydrate` lit encore la
     base. À cet instant le statut vaut « loading » et non « onboarding » — le
     figer au montage revenait à répondre non à chaque fois. */
  const sawEmpty = useRef(false)
  useEffect(() => {
    if (status === 'onboarding') {
      sawEmpty.current = true
      return
    }
    if (status === 'ready' && sawEmpty.current) void navigate('/', { replace: true })
  }, [status, navigate])

  const empty = status === 'onboarding'

  return (
    /* `px-4 md:px-8` — le cadre exact d'`AppShell`. Les tuiles de démonstration
       font alors très précisément la largeur de celles du vrai mois, ce que la
       page prétend montrer ; et sur une 2×1 à 320px, ces huit pixels sont huit
       pour cent de la place disponible. */
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:px-8 md:py-14">
      <header className="flex flex-col gap-5">
        <span className="t-eyebrow text-muted">{fr.app.name}</span>
        <h1 className="t-hero-fit max-w-[16ch]">{fr.app.tagline}</h1>
        <p className="t-body max-w-prose">{fr.landing.intro}</p>

        {/* Tant que l'hydratation n'a pas répondu, on ne sait pas encore quoi
            proposer. Rien plutôt qu'un bouton qui changerait de sens sous le
            doigt — la lecture de la base se compte en dizaines de
            millisecondes, et un libellé qui se corrige se remarque plus qu'une
            rangée qui apparaît. */}
        {status !== 'loading' && (
          <div className="flex flex-wrap items-center gap-3">
            {empty ? (
              <>
                <Button
                  onClick={() => {
                    void navigate(ONBOARDING_PATH)
                  }}
                >
                  {fr.landing.start}
                </Button>
                {/* Aucune confirmation : rien n'a encore été enregistré, et
                    faire confirmer la perte de rien n'apprend qu'une chose —
                    que les questions de cette app ne veulent rien dire. */}
                <ExampleControl confirm={false} />
              </>
            ) : (
              <Button
                onClick={() => {
                  void navigate('/')
                }}
              >
                {fr.landing.open}
              </Button>
            )}
          </div>
        )}

        <p className="t-label">{fr.landing.privacy}</p>
      </header>

      <div className="flex flex-col gap-3">
        <LandingTiles />
        {/* La seule chose qui empêche la grille de mentir. En texte lisible et
            non en filigrane : un avertissement qu'on ne peut pas lire n'en est
            pas un. */}
        <p className="t-label">{fr.landing.sample}</p>
      </div>

      <LandingPrinciples />

      {empty && <LandingDoors />}

      <AppFooter />
    </div>
  )
}

/**
 * Le raisonnement, en prose et hors de la grille.
 *
 * Il vivait dans les tuiles, et les faisait déborder par le bas à 320px : le DS
 * §5 plafonne une tuile à un eyebrow, un chiffre, une lecture secondaire et une
 * visualisation, et trois lignes d'explication n'entrent dans aucune des quatre
 * cases. Posées ici, elles ont la largeur du texte et la hauteur qu'elles
 * demandent — et la grille au-dessus redevient ce qu'elle est : la démonstration
 * elle-même, qui n'a pas à se commenter.
 */
function LandingPrinciples() {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="t-section">{fr.landing.principles}</h2>
      {/* Deux colonnes et non quatre : à `max-w-5xl`, quatre blocs de prose
          tombent sous 230px de large, où une ligne ne porte plus que cinq mots. */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          { title: fr.landing.monthTitle, body: fr.landing.monthBody },
          { title: fr.landing.splitTitle, body: fr.landing.splitBody },
          { title: fr.landing.kindsTitle, body: fr.landing.kindsBody },
          { title: fr.landing.privacyTitle, body: fr.landing.privacyBody },
        ].map((item) => (
          <div key={item.title} className="flex max-w-prose flex-col gap-2">
            <h3 className="t-body font-semibold">{item.title}</h3>
            <p className="t-label">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Deux façons de ne pas commencer par une page blanche, pour les deux personnes
 * qui arrivent ici sans rien à saisir : celle qui restaure une sauvegarde, et
 * celle qui a déjà tout écrit ailleurs. La troisième — celle qui veut seulement
 * voir — est servie tout en haut, à côté du bouton principal : c'est une porte
 * d'entrée, pas un recours, et le même bouton deux fois sur un même écran ne se
 * lit plus comme deux occasions mais comme une redite.
 *
 * Toutes trois vivaient sous le formulaire des deux questions, en petits
 * caractères. Leur argument était déjà qu'aucune n'a de raison de créer d'abord
 * un foyer qu'elle remplacera dans la foulée — il ne s'affaiblit pas en
 * remontant ici, il s'accomplit : « ici » désignait l'écran d'arrivée, et
 * l'écran d'arrivée est désormais cette page. Le message d'erreur de
 * l'hydratation, qui promet l'import, atterrit lui aussi ici.
 *
 * Pas de `BentoGrid` : ce sont des actions, pas des lectures. La grille bento
 * impose des hauteurs de rangée faites pour des chiffres, et un bouton ancré au
 * bas d'une tuile de 188px s'y retrouve à flotter loin du texte qu'il sert.
 */
function LandingDoors() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="t-section">{fr.landing.doors}</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <Tile className="gap-3">
          <Eyebrow icon={DataIcon}>{fr.landing.importTitle}</Eyebrow>
          <p className="t-label">{fr.landing.importHint}</p>
          <ImportControl />
        </Tile>

        <Tile className="gap-3">
          <Eyebrow icon={RecurrencesIcon}>{fr.landing.schemaTitle}</Eyebrow>
          <p className="t-label">{fr.landing.schemaHint}</p>
          <SchemaControl />
        </Tile>
      </div>
    </section>
  )
}
