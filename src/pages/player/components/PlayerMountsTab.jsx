import { useState } from 'react';
import { playerApi } from '../../../api/services/player.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import ChestGrid from '../../../components/rpg/ChestGrid';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

export default function PlayerMountsTab({ lang }) {
  const [selectedMountSlot, setSelectedMountSlot] = useState(null);

  const { data: mountsData, loading: mountsLoading } = useAsyncData(async () => {
    try {
      return await playerApi.getMyMounts();
    } catch {
      return null;
    }
  }, []);

  const mountsList = Array.isArray(mountsData?.mounts) ? mountsData.mounts : [];
  const activeMount =
    mountsList.find((m) => m.slot === selectedMountSlot) || mountsList[0] || null;
  const saddlebagItems = Array.isArray(activeMount?.saddleStorage?.items)
    ? activeMount.saddleStorage.items
    : [];
  const saddlebagCapacity = Math.max(
    9,
    Number(activeMount?.saddleStorage?.capacity || saddlebagItems.length || 27)
  );

  const mountColumns = [
    {
      key: 'name',
      header: lang === 'vi' ? 'THÚ CƯỠI (BẤM ĐỂ MỞ TÚI YÊN)' : 'MOUNT (CLICK TO INSPECT)',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedMountSlot(row.slot)}
          className="text-left font-mono text-xs hover:text-accent-emerald"
        >
          <div className="font-bold text-ink-primary">
            #{row.slot} — {row.customName || row.type || 'MOUNT'}
          </div>
          {row.customName && row.type && (
            <div className="text-[11px] text-ink-secondary">{row.type}</div>
          )}
        </button>
      ),
    },
    {
      key: 'tiers',
      header: lang === 'vi' ? 'CHỈ SỐ NÂNG CẤP (TIER)' : 'UPGRADE TIERS',
      render: (row) => {
        const t = row.tiers || {};
        return (
          <span className="font-mono text-[11px] text-ink-secondary tabular-nums">
            SPD:{t.speed ?? 0} | JMP:{t.jump ?? 0} | DUR:{t.durability ?? 0} | BAG:{t.storage ?? 0}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => (
        <StatusTag
          label={row.isDead ? (lang === 'vi' ? 'HỒI SINH' : 'INJURED') : 'READY'}
          variant={row.isDead ? 'crimson' : 'emerald'}
        />
      ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-3 border border-border-strong bg-surface p-4 lg:col-span-5">
        <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
          [SADDLEBAG // {lang === 'vi' ? 'KHO YÊN THÚ CƯỠI' : 'MOUNT STORAGE'}]
        </div>

        {activeMount ? (
          <div className="space-y-3">
            <div className="border border-border-subtle bg-canvas p-3 font-mono text-xs">
              <div className="font-bold text-ink-primary">
                SLOT #{activeMount.slot} — {activeMount.customName || activeMount.type}
              </div>
              <div className="mt-1 text-ink-secondary tabular-nums">
                SPD T{activeMount.tiers?.speed ?? 0} // JMP T{activeMount.tiers?.jump ?? 0} // DUR
                T{activeMount.tiers?.durability ?? 0} // BAG T{activeMount.tiers?.storage ?? 0}
              </div>
            </div>

            <div className="overflow-x-auto">
              <ChestGrid
                title={lang === 'vi' ? 'TÚI YÊN NGỰA' : 'SADDLEBAG'}
                items={saddlebagItems}
                totalSlots={saddlebagCapacity}
                mode="slot"
              />
            </div>
          </div>
        ) : (
          <div className="border border-border-subtle bg-canvas p-6 text-center font-mono text-xs text-ink-secondary">
            [{lang === 'vi' ? 'CHƯA SỞ HỮU THÚ CƯỠI' : 'NO ACTIVE MOUNT'}]
          </div>
        )}
      </div>

      <div className="space-y-3 lg:col-span-7">
        <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
          [STABLE // {lang === 'vi' ? 'DANH SÁCH THÚ CƯỠI' : 'MOUNT ROSTER'}]
        </div>
        <DataTable
          columns={mountColumns}
          rows={mountsList}
          rowKey={(row) => row.slot}
          loading={mountsLoading}
        />
      </div>
    </div>
  );
}