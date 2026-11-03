// Misiones: los encargos de los cuatro mercaderes, un panel por mercader. Arriba, las que ya se pueden cobrar.
import { useGame } from '../../state/store';
import { VENDORS, VENDOR_ORDER } from '../../../core/data/vendors';
import { offeredQuests, questDef, questProgress } from '../../../core/quests';
import { MonsterSprite } from '../common';
import { VendorQuests } from '../VendorsTab';
import { Panel } from '../kit';
import { useLayout } from '../../../config/ui';

export function Misiones() {
  const profile = useGame((s) => s.profile)!;
  const layout = useLayout();
  const ready = (id: (typeof VENDOR_ORDER)[number]) => offeredQuests(profile, id).filter((q) => questProgress(q, profile) >= questDef(q.id).count).length;
  // Primero los mercaderes con misiones listas para cobrar
  const order = [...VENDOR_ORDER].sort((a, b) => ready(b) - ready(a));
  return (
    <div className="h-full overflow-y-auto scroll-thin" style={{ padding: '0 max(var(--pad), env(safe-area-inset-right)) var(--pad) max(var(--pad), env(safe-area-inset-left))' }} data-testid="screen-quests">
      <div className="grid mx-auto max-w-[1400px]" style={{ gridTemplateColumns: layout === 'desktop' ? 'repeat(2, minmax(0,1fr))' : '1fr', gap: 'var(--gap)' }}>
        {order.map((id) => (
          <Panel key={id} testId={`quests-${id}`}
            title={<span className="inline-flex items-center gap-2"><MonsterSprite sprite={VENDORS[id].sprite} scale={1} />{VENDORS[id].name}{ready(id) > 0 && <span className="ml-1 text-[11px] min-w-[18px] h-[18px] leading-[18px] text-center bg-heal text-black">{ready(id)}</span>}</span>}>
            <VendorQuests vendor={id} />
          </Panel>
        ))}
      </div>
    </div>
  );
}
