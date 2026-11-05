// Misiones: arriba las que llevas aceptadas (máximo 5: cobrar, dejar o fijar); debajo, el tablón de cada mercader.
import { useGame } from '../../state/store';
import { VENDORS, VENDOR_ORDER } from '../../../core/data/vendors';
import { MAX_ACTIVE_QUESTS } from '../../../core/data/quests';
import { activeQuests, boardQuests, isComplete } from '../../../core/quests';
import { MonsterSprite } from '../common';
import { QuestCard, VendorQuests } from '../VendorsTab';
import { Panel } from '../kit';
import { useLayout } from '../../../config/ui';

export function Misiones() {
  const profile = useGame((s) => s.profile)!;
  const layout = useLayout();
  // Primero las listas para cobrar, luego las fijadas
  const active = activeQuests(profile).sort((a, b) => Number(isComplete(b, profile)) - Number(isComplete(a, profile)) || Number(!!b.pinned) - Number(!!a.pinned));
  const order = VENDOR_ORDER.filter((id) => boardQuests(profile, id).length > 0);
  return (
    <div className="h-full overflow-y-auto scroll-thin" style={{ padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))' }} data-testid="screen-quests">
      <div className="mx-auto max-w-[1400px] flex flex-col" style={{ gap: 'var(--gap)' }}>
        <Panel testId="quests-active" title={<span>Tus misiones · {active.length}/{MAX_ACTIVE_QUESTS}</span>}>
          {active.length
            ? <div className="grid" style={{ gridTemplateColumns: layout === 'desktop' ? 'repeat(2, minmax(0,1fr))' : '1fr', gap: 'var(--gap)' }}>{active.map((p) => <QuestCard key={p.id} p={p} mode="active" />)}</div>
            : <p className="font-body text-lg text-stone-300">No llevas ninguna misión. Acepta hasta {MAX_ACTIVE_QUESTS} del tablón de los mercaderes: solo avanzan las que aceptas.</p>}
          <p className="font-body text-base text-stone-400 italic mt-3">Las misiones de caza, cofres y extracción avanzan al terminar cada expedición. Las entregas se cobran con lo que tengas en la mochila y el alijo. Fija una para tenerla presente en la mazmorra. Si dejas una misión, pierdes lo que llevabas.</p>
        </Panel>
        <h2 className="ui-ptitle border-0 !text-[clamp(14px,1.6vw,22px)] !tracking-[0.18em] text-center">Tablón de encargos</h2>
        <div className="grid" style={{ gridTemplateColumns: layout === 'desktop' ? 'repeat(2, minmax(0,1fr))' : '1fr', gap: 'var(--gap)' }}>
          {order.map((id) => (
            <Panel key={id} testId={`quests-${id}`} title={<span className="inline-flex items-center gap-2"><MonsterSprite sprite={VENDORS[id].sprite} scale={1} />{VENDORS[id].name}</span>}>
              <VendorQuests vendor={id} showActive={false} />
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
