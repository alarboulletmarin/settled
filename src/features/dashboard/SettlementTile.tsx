import { useNavigate } from 'react-router-dom'
import { SPLIT_PATH } from '@/app/routes'
import { addMonthsToYm } from '@/domain/date'
import { fr } from '@/i18n/fr'
import { de, formatMonthName, formatYearMonth, formatMoney, tpl } from '@/i18n/format'
import { useCurrentYm, useMemberCharges, useMemberFilter, useMemberMap } from '@/store/selectors'
import { Amount } from '@/ui/Amount'
import { Eyebrow } from '@/ui/Eyebrow'
import { SplitIcon } from '@/ui/Icons'
import { Tile } from '@/ui/Tile'
import { useCurrency } from '@/ui/currency'

/**
 * Ce que le mois précédent reporte sur le virement de la personne filtrée.
 *
 * Elle vit à part, et non en ligne de plus sur « À verser sur le commun » : le
 * DS §5 plafonne une tuile à quatre éléments et tranche le cas — « si elle en
 * demande un cinquième, c'est deux tuiles ». La cinquième ligne qu'elle y
 * tenait passait à la ligne dans une colonne de 222px, en mono 11px dont
 * l'interligne vaut 1, puis se faisait couper par le bas.
 *
 * `4x1` et non `2x1` : sur mobile une `2x1` reste en demi-colonne, seule de
 * tous les formats, et ses voisines y masquent leur lecture secondaire. En
 * pleine largeur, la phrase qui dit le sens du report tient à côté du montant.
 *
 * Le signe porte le sens, et le ton reste neutre : verser plus n'est ni un
 * dépassement ni une erreur, et le DS §2.2 réserve `--danger` à ceux-là.
 */
export function SettlementTile() {
  const charges = useMemberCharges()
  const filter = useMemberFilter()
  const members = useMemberMap()
  const month = useCurrentYm()
  const currency = useCurrency()
  const navigate = useNavigate()

  // Rien à rattraper, rien à dire : une tuile à zéro laisserait croire à une
  // régularisation là où les comptes tombaient justes.
  if (filter === undefined || charges === null || charges.adjustment === 0) return null

  const previousYm = addMonthsToYm(month, -1)
  const previous = de(formatMonthName(previousYm))
  const hint = tpl(
    charges.adjustment < 0 ? fr.dashboard.settlementLess : fr.dashboard.settlementMore,
    previous,
  )
  // La lecture parlée, elle, garde l'année : rien ne l'y contraint.
  const spoken = tpl(
    fr.dashboard.srSettlement,
    de(formatYearMonth(previousYm)),
    formatMoney(charges.adjustment, currency),
    members.get(filter)?.name ?? '',
  )

  return (
    <Tile
      span="4x1"
      className="justify-between"
      onClick={() => {
        void navigate(SPLIT_PATH)
      }}
      label={spoken}
      /* Repère nu : une tuile plate pose le sien sur la ligne de l'eyebrow, et
         « Répartition › » y disputait la largeur à « RÉGULARISATION ». */
      affordance={{ kind: 'navigate' }}
    >
      <Eyebrow icon={SplitIcon}>{fr.dashboard.settlement}</Eyebrow>
      <div className="flex flex-wrap items-baseline gap-x-2">
        {/* `signed` et sans `direction` : ce n'est pas un flux dont on lirait la
            valeur absolue, c'est un écart dont le signe est toute la lecture. */}
        <Amount value={charges.adjustment} size="tile-fit" signed />
        <span className="t-label">{hint}</span>
      </div>
    </Tile>
  )
}
