import type { Flow } from '@/domain/stats'
import { fr } from '@/i18n/fr'
import { formatMoney, tpl } from '@/i18n/format'
import { useMonthFlows } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { ChargesIcon, type IconComponent, IncomeIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'
/** Ce qu'une tuile de flux fait au clic, quand il y a des lignes à montrer. */
export type ShowFlow = (direction: 'in' | 'out') => void

/**
 * Les deux chiffres que les quatre soldes combinent sans jamais les dire :
 * ce qu'on gagne, et ce qu'on paie. Un solde répond « ce qu'il te reste », ce
 * qui ne répond pas à « combien je paie ce mois-ci ».
 *
 * Le chiffre est celui du mois entier, échéances prévues comprises : la
 * question se pose le 3 comme le 28, et un total qui s'arrêterait au confirmé
 * répondrait « presque rien » en début de mois. Ce qui reste à tomber se lit
 * en seconde lecture, là où les autres tuiles plates mettent la leur.
 *
 * **Ces deux-là prennent deux colonnes sous 1024px**, seules de toutes les
 * `2x1` : la pleine largeur sur la grille mobile, la moitié sur le palier
 * tablette. C'est ce qui rend leur seconde lecture visible — et sans elle,
 * elle ne l'était nulle part. Les quatre soldes voisins s'en passent parce
 * qu'une feuille la porte sur téléphone (`MetricInfo`) ; ces deux tuiles-ci
 * n'en ont pas, et ne doivent pas en avoir : devant « Charges : 1 166 € », la
 * question suivante n'est pas « qu'est-ce qu'une charge » mais « lesquelles ».
 * Le coût est de deux rangées de plus à faire défiler sur un téléphone, pour
 * les deux chiffres qu'on vient chercher en premier.
 *
 * Le clic filtre la liste du mois sur ce sens-là et l'amène sous les yeux. Il
 * ouvrait une feuille qui définissait le chiffre : devant « Charges : 1 166 € »,
 * la question suivante n'est pas « qu'est-ce qu'une charge » mais « lesquelles ».
 * Le rangement de la liste n'y touche pas — filtrer n'est pas ranger, et l'axe
 * choisi est celui de l'utilisateur.
 *
 * Sans ligne confirmée de ce sens, la tuile n'est pas cliquable : mieux vaut
 * qu'elle ne réponde pas que de mener à une liste où son chiffre n'est pas.
 */
function FlowTile({
  label,
  icon,
  flow,
  direction,
  hint,
  onShow,
}: {
  label: string
  icon: IconComponent
  flow: Flow
  direction: 'in' | 'out'
  hint: string
  onShow?: ShowFlow
}) {
  return (
    <Tile
      span="2x1"
      className="justify-between max-lg:col-span-2"
      {...(onShow === undefined
        ? {}
        : {
            onClick: () => {
              onShow(direction)
            },
            label: tpl(fr.dashboard.showLines, label),
            // Une flèche vers le bas, pas un chevron : la liste est plus bas
            // sur cette page, elle n'est pas sur un autre écran.
            affordance: { kind: 'scroll' as const, destination: fr.month.entries },
          })}
    >
      <Eyebrow icon={icon}>{label}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        {/* Un flux, pas un solde : la valeur est absolue, et le « + » du DS §3
            distingue l'une de l'autre les deux tuiles voisines. */}
        <Amount value={flow.total} size="tile-fit" direction={direction} />
        {/* Lue par un lecteur d'écran quoi qu'il arrive, affichée dès que la
            tuile est assez large pour la porter — c'est la tuile qui décide,
            pas l'écran (voir `.tile-hint`). */}
        <span className="t-label tile-hint">{hint}</span>
      </div>
    </Tile>
  )
}

export function IncomeTile({ onShow }: { onShow?: ShowFlow }) {
  const { income } = useMonthFlows()
  const currency = useCurrency()

  const hint =
    income.total === 0
      ? fr.dashboard.incomeNone
      : income.left > 0
        ? tpl(fr.dashboard.incomeLeft, formatMoney(income.left, currency, false))
        : fr.dashboard.incomeAllIn

  return (
    <FlowTile
      label={fr.dashboard.income}
      icon={IncomeIcon}
      flow={income}
      direction="in"
      hint={hint}
      {...(onShow === undefined ? {} : { onShow })}
    />
  )
}

export function ChargesTile({ onShow }: { onShow?: ShowFlow }) {
  const { spending } = useMonthFlows()
  const currency = useCurrency()

  const hint =
    spending.total === 0
      ? fr.dashboard.chargesNone
      : spending.left > 0
        ? tpl(fr.dashboard.chargesLeft, formatMoney(spending.left, currency, false))
        : fr.dashboard.chargesAllPaid

  return (
    <FlowTile
      label={fr.dashboard.charges}
      icon={ChargesIcon}
      flow={spending}
      direction="out"
      hint={hint}
      {...(onShow === undefined ? {} : { onShow })}
    />
  )
}
