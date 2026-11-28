import { useState } from 'react';
import { Link } from 'react-router-dom';
import { playerApi } from '../../api/services/player.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDateTime } from '../../utils/date.util';
import ChestGrid from '../../components/rpg/ChestGrid';
import ItemSlotCell from '../../components/rpg/ItemSlotCell';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../components/rpg/PlayerBadge';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';

const MAIN_INVENTORY_SLOTS = Array.from({ length: 27 }, (_, i) => i + 9);
const HOTBAR_SLOTS = Array.from({ length: 9 }, (_, i) => i);

const EQUIPMENT_LABELS = {
  helmet: { vi: 'MŨ GIÁP', en: 'HELMET' },
  chestplate: { vi: 'ÁO GIÁP', en: 'CHESTPLATE' },
  leggings: { vi: 'QUẦN GIÁP', en: 'LEGGINGS' },
  boots: { vi: 'GIÀY GIÁP', en: 'BOOTS' },
  mainHand: { vi: 'VŨ KHÍ CHÍNH', en: 'MAIN HAND' },
  offHand: { vi: 'TAY PHỤ', en: 'OFF HAND' },
  necklace: { vi: 'DÂY CHUYỀN', en: 'NECKLACE' },
  ring: { vi: 'NHẪN', en: 'RING' },
  artifact: { vi: 'CỔ VẬT', en: 'ARTIFACT' },
};

function normalizeCharacterList(profile) {
  if (!profile) return [];
  if (Array.isArray(profile.characters) && profile.characters.length > 0) {
    return profile.characters;
  }
  if (Array.isArray(profile.slots) && profile.slots.length > 0) {
    return profile.slots;
  }
  if (profile.activeCharacter || profile.character) {
    return [profile.activeCharacter || profile.character];
  }
  return [
    {
      slot: 1,
      className: profile.className || profile.rpgClass || 'ADVENTURER',
      level: profile.level ?? 1,
      exp: profile.exp ?? 0,
      maxExp: profile.maxExp ?? 100,
      stats: profile.stats || profile.attributes || {},
      equipment: profile.equipment || profile.armor || {},
      inventory: profile.inventory || [],
    },
  ];
}

function normalizeEquipmentEntries(equipmentRaw, lang) {
  if (!equipmentRaw) return [];

  if (Array.isArray(equipmentRaw)) {
    return equipmentRaw.map((item, idx) => ({
      key: item.slotName || `equip_${idx}`,
      label: item.slotLabel || item.slotName || `SLOT #${idx + 1}`,
      item,
    }));
  }

  if (typeof equipmentRaw === 'object') {
    return Object.entries(equipmentRaw).map(([key, item]) => ({
      key,
      label:
        EQUIPMENT_LABELS[key]?.[lang] ||
        key.replace(/([A-Z])/g, ' $1').toUpperCase(),
      item: item && typeof item === 'object' ? item : null,
    }));
  }

  return [];
}

async function safeOptionalFetch(fetcher) {
  try {
    return await fetcher();
  } catch {
    return null;
  }
}

export default function PlayerHubPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('INVENTORY');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [inspectedItem, setInspectedItem] = useState(null);

  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useAsyncData(() => playerApi.getMyProfile(), []);

  const hasEmbeddedInventory = Boolean(
    profile?.inventory || profile?.activeCharacter?.inventory || profile?.characters?.[0]?.inventory
  );
  const hasEmbeddedMounts = Boolean(profile?.mounts || profile?.activeMount);
  const hasEmbeddedQuests = Boolean(profile?.quests);
  const hasEmbeddedWaystones = Boolean(profile?.waystones);
  const hasEmbeddedFriends = Boolean(profile?.friends);

  const { data: extraInventory, loading: invLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyInventory()),
    [hasEmbeddedInventory],
    { immediate: Boolean(profile && !hasEmbeddedInventory) }
  );

  const { data: extraMounts, loading: mountsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyMounts()),
    [activeTab, hasEmbeddedMounts],
    { immediate: Boolean(profile && activeTab === 'MOUNTS' && !hasEmbeddedMounts) }
  );

  const { data: extraQuests, loading: questsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyQuests()),
    [activeTab, hasEmbeddedQuests],
    { immediate: Boolean(profile && activeTab === 'PROGRESSION' && !hasEmbeddedQuests) }
  );

  const { data: extraWaystones } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyWaystones()),
    [activeTab, hasEmbeddedWaystones],
    { immediate: Boolean(profile && activeTab === 'WORLD_SOCIAL' && !hasEmbeddedWaystones) }
  );

  const { data: extraFriends } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyFriends()),
    [activeTab, hasEmbeddedFriends],
    { immediate: Boolean(profile && activeTab === 'WORLD_SOCIAL' && !hasEmbeddedFriends) }
  );

  if (profileLoading) {
    return (
      <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
        [{lang === 'vi' ? 'ĐANG TẢI HỒ SƠ NHÂN VẬT...' : 'LOADING PLAYER HUB...'}]
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="space-y-3 border border-accent-crimson bg-surface p-6">
        <div className="font-mono text-xs font-bold text-accent-crimson">
          [ERROR // {profileError?.message || 'PROFILE_LOAD_FAILED'}]
        </div>
        <button
          type="button"
          onClick={() => reloadProfile()}
          className="border border-border-strong bg-canvas px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary hover:bg-subheader"
        >
          [{lang === 'vi' ? 'THỬ LẠI' : 'RETRY'}]
        </button>
      </div>
    );
  }

  const characters = normalizeCharacterList(profile);
  const safeCharIndex = Math.min(selectedSlotIdx, Math.max(0, characters.length - 1));
  const currentChar = characters[safeCharIndex] || {};

  const playerIdentity = {
    username: profile.username || profile.player?.username || 'Unknown',
    uuid: profile.uuid || profile.player?.uuid,
    isVip: Boolean(profile.isVip ?? profile.player?.isVip),
    adventurerRank: profile.adventurerRank || profile.player?.adventurerRank,
    guildTag: profile.guild?.tag || profile.guildTag,
    role: profile.role,
  };

  const guildInfo = profile.guild || null;
  const currencyData = profile.balance ?? profile.currency ?? profile.coins ?? 0;

  // Hợp nhất dữ liệu túi đồ & trang bị
  const invPayload = extraInventory || {};
  const inventoryItems = Array.isArray(currentChar.inventory)
    ? currentChar.inventory
    : Array.isArray(profile.inventory)
    ? profile.inventory
    : Array.isArray(invPayload.items)
    ? invPayload.items
    : Array.isArray(invPayload.inventory)
    ? invPayload.inventory
    : [];

  const enderChestItems = Array.isArray(currentChar.enderChest)
    ? currentChar.enderChest
    : Array.isArray(profile.enderChest)
    ? profile.enderChest
    : Array.isArray(invPayload.enderChest)
    ? invPayload.enderChest
    : [];

  const equipmentEntries = normalizeEquipmentEntries(
    currentChar.equipment || profile.equipment || invPayload.equipment,
    lang
  );

  // Hợp nhất chỉ số chiến đấu
  const statsObj = currentChar.stats || currentChar.attributes || profile.stats || {};
  const statEntries = Object.entries(statsObj).filter(
    ([, val]) => typeof val === 'number' || typeof val === 'string'
  );

  // Hợp nhất thú cưỡi & kho yên
  const mountsSource = extraMounts || profile;
  const mountsList = Array.isArray(mountsSource?.mounts)
    ? mountsSource.mounts
    : Array.isArray(mountsSource?.items)
    ? mountsSource.items
    : [];
  const activeMount =
    mountsSource?.activeMount ||
    mountsList.find((m) => m.isActive || m.summoned) ||
    mountsList[0] ||
    null;
  const saddlebagItems = Array.isArray(activeMount?.saddlebag)
    ? activeMount.saddlebag
    : Array.isArray(mountsSource?.saddlebag)
    ? mountsSource.saddlebag
    : [];

  // Hợp nhất nghề nghiệp & nhiệm vụ
  const professionsRaw =
    currentChar.professions || profile.professions || profile.skills || [];
  const professionsList = Array.isArray(professionsRaw)
    ? professionsRaw
    : Object.entries(professionsRaw).map(([id, val]) => ({
        id,
        name: id.toUpperCase(),
        ...(typeof val === 'object' ? val : { level: val }),
      }));

  const questsSource = extraQuests || profile;
  const questsList = Array.isArray(questsSource?.quests)
    ? questsSource.quests
    : Array.isArray(questsSource?.items)
    ? questsSource.items
    : [];

  // Hợp nhất Waystones & Bạn bè
  const waystonesSource = extraWaystones || profile;
  const waystonesList = Array.isArray(waystonesSource?.waystones)
    ? waystonesSource.waystones
    : Array.isArray(waystonesSource?.items)
    ? waystonesSource.items
    : [];

  const friendsSource = extraFriends || profile;
  const friendsList = Array.isArray(friendsSource?.friends)
    ? friendsSource.friends
    : Array.isArray(friendsSource?.items)
    ? friendsSource.items
    : [];

  const charExp = Number(currentChar.exp ?? 0);
  const charMaxExp = Math.max(1, Number(currentChar.maxExp ?? currentChar.nextLevelExp ?? 100));
  const expPercent = Math.min(100, Math.max(0, Math.round((charExp / charMaxExp) * 100)));

  const tabs = [
    { id: 'INVENTORY', label: lang === 'vi' ? 'TÚI ĐỒ & TRANG BỊ' : 'INVENTORY & GEAR' },
    { id: 'MOUNTS', label: lang === 'vi' ? 'THÚ CƯỠI & KHO YÊN' : 'MOUNTS & SADDLEBAG' },
    { id: 'PROGRESSION', label: lang === 'vi' ? 'NGHỀ NGHIỆP & NHIỆM VỤ' : 'PROFESSIONS & QUESTS' },
    { id: 'WORLD_SOCIAL', label: lang === 'vi' ? 'WAYSTONE & BẠN BÈ' : 'WAYSTONES & FRIENDS' },
  ];

  const mountColumns = [
    {
      key: 'name',
      header: lang === 'vi' ? 'THÚ CƯỠI' : 'MOUNT',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">{row.name || row.displayName || row.id}</div>
          {row.type && <div className="text-[11px] text-ink-secondary">{row.type}</div>}
        </div>
      ),
    },
    {
      key: 'level',
      header: lang === 'vi' ? 'CẤP / HẠNG' : 'LEVEL / TIER',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-accent-emerald tabular-nums">
          LV.{row.level ?? 1} {row.tier ? `[T${row.tier}]` : ''}
        </span>
      ),
    },
    {
      key: 'stats',
      header: lang === 'vi' ? 'TỐC ĐỘ // THỂ LỰC' : 'SPEED // STAMINA',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-ink-secondary tabular-nums">
          SPD: {row.speed ?? '—'} // STA: {row.stamina ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => (
        <StatusTag
          label={row.isActive || row.summoned ? 'ACTIVE' : 'STABLED'}
          variant={row.isActive || row.summoned ? 'emerald' : 'neutral'}
        />
      ),
    },
  ];

  const questColumns = [
    {
      key: 'quest',
      header: lang === 'vi' ? 'NHIỆM VỤ' : 'QUEST',
      render: (row) => (
        <div>
          <div className="font-semibold text-ink-primary">
            {row.title || row.name || row.questId || row.id}
          </div>
          {row.objective && (
            <div className="mt-0.5 font-mono text-[11px] text-ink-secondary">
              {row.objective}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'progress',
      header: lang === 'vi' ? 'TIẾN ĐỘ' : 'PROGRESS',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-semibold tabular-nums">
          {row.progress !== undefined && row.target !== undefined
            ? `${row.progress} / ${row.target}`
            : row.progressText || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => {
        const st = String(row.status || 'ACTIVE').toUpperCase();
        return (
          <StatusTag
            label={st}
            variant={st === 'COMPLETED' || st === 'DONE' ? 'emerald' : 'amber'}
          />
        );
      },
    },
  ];

  const waystoneColumns = [
    {
      key: 'name',
      header: lang === 'vi' ? 'ĐIỂM DỊCH CHUYỂN' : 'WAYSTONE NAME',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-ink-primary">
          {row.name || row.displayName || row.id}
        </span>
      ),
    },
    {
      key: 'world',
      header: lang === 'vi' ? 'THẾ GIỚI' : 'WORLD',
      render: (row) => (
        <span className="font-mono text-xs text-ink-secondary">{row.world || 'world'}</span>
      ),
    },
    {
      key: 'coords',
      header: lang === 'vi' ? 'TỌA ĐỘ (X / Y / Z)' : 'COORDINATES (X / Y / Z)',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-accent-emerald tabular-nums">
          {Math.round(Number(row.x ?? 0))} / {Math.round(Number(row.y ?? 0))} /{' '}
          {Math.round(Number(row.z ?? 0))}
        </span>
      ),
    },
  ];

  const friendColumns = [
    {
      key: 'friend',
      header: lang === 'vi' ? 'NGƯỜI CHƠI' : 'PLAYER',
      render: (row) => <PlayerBadge player={row} />,
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'PRESENCE',
      align: 'right',
      render: (row) => (
        <StatusTag
          label={row.online ? 'ONLINE' : 'OFFLINE'}
          variant={row.online ? 'emerald' : 'neutral'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Identity Block */}
      <div className="flex flex-wrap items-start justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
            [PLAYER HUB // PERSONAL CHARACTER LEDGER]
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <PlayerBadge player={playerIdentity} linkToProfile={false} showUuid />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <Link
            to={`/players/${encodeURIComponent(playerIdentity.username)}`}
            className="border border-border-strong bg-canvas px-3 py-1.5 font-semibold text-ink-primary hover:bg-subheader"
          >
            {lang === 'vi' ? 'XEM HỒ SƠ CÔNG KHAI >' : 'PUBLIC DOSSIER >'}
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 border border-border-strong bg-surface md:grid-cols-4">
        <div className="border-r border-b border-border-subtle p-3.5 md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'NGÂN KHỐ CÁ NHÂN' : 'WALLET BALANCE'}
          </div>
          <div className="mt-1">
            <CurrencyDisplay currency={currencyData} />
          </div>
        </div>

        <div className="border-b border-border-subtle p-3.5 md:border-r md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'BANG HỘI HIỆN TẠI' : 'GUILD AFFILIATION'}
          </div>
          <div className="mt-1 font-mono text-xs font-bold">
            {guildInfo ? (
              <Link
                to="/guilds/me"
                className="text-accent-emerald underline underline-offset-2"
              >
                {guildInfo.name} [{guildInfo.role || 'MEMBER'}]
              </Link>
            ) : (
              <span className="text-ink-secondary">
                {lang === 'vi' ? 'CHƯA GIA NHẬP BANG' : 'NO GUILD'}
              </span>
            )}
          </div>
        </div>

        <div className="border-r border-border-subtle p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'LỚP NHÂN VẬT // CẤP' : 'CLASS // LEVEL'}
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-ink-primary tabular-nums">
            {String(currentChar.className || currentChar.rpgClass || 'ADVENTURER').toUpperCase()} — LV.
            {currentChar.level ?? 1}
          </div>
        </div>

        <div className="p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'CẬP NHẬT LẦN CUỐI' : 'LAST SYNC'}
          </div>
          <div className="mt-1 font-mono text-xs text-ink-primary tabular-nums">
            {formatDateTime(profile.lastSeen || profile.updatedAt, lang)}
          </div>
        </div>
      </div>

      {/* Multi-Slot Character Switcher & Combat Attributes */}
      <div className="border border-border-strong bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div className="font-mono text-xs font-bold uppercase text-ink-primary">
            [CHARACTER SLOTS // {lang === 'vi' ? 'HỒ SƠ NHÂN VẬT' : 'ACTIVE PROFILES'}]
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {characters.map((char, idx) => {
              const slotNum = char.slot ?? idx + 1;
              const isSelected = idx === safeCharIndex;
              return (
                <button
                  key={char.id || slotNum}
                  type="button"
                  onClick={() => {
                    setSelectedSlotIdx(idx);
                    setInspectedItem(null);
                  }}
                  className={`border border-border-strong px-2.5 py-1 font-semibold tabular-nums ${
                    isSelected
                      ? 'bg-ink-primary text-white'
                      : 'bg-canvas text-ink-primary hover:bg-subheader'
                  }`}
                >
                  SLOT #{slotNum} ({String(char.className || char.rpgClass || 'CHAR').toUpperCase()} LV.
                  {char.level ?? 1})
                </button>
              );
            })}
          </div>
        </div>

        {/* EXP Bar & Attributes */}
        <div className="mt-3 grid gap-4 md:grid-cols-12">
          <div className="space-y-1.5 md:col-span-5">
            <div className="flex items-center justify-between font-mono text-xs tabular-nums">
              <span className="font-bold text-ink-primary">
                LEVEL {currentChar.level ?? 1}
              </span>
              <span className="text-ink-secondary">
                EXP: {charExp.toLocaleString()} / {charMaxExp.toLocaleString()} ({expPercent}%)
              </span>
            </div>
            <div className="border border-border-strong bg-canvas p-0.5">
              <div
                style={{ width: `${expPercent}%` }}
                className="h-2 bg-accent-emerald"
              />
            </div>
          </div>

          <div className="md:col-span-7">
            {statEntries.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {statEntries.map(([statKey, statVal]) => (
                  <div
                    key={statKey}
                    className="border border-border-subtle bg-canvas px-2.5 py-1.5 font-mono text-xs tabular-nums"
                  >
                    <div className="text-[10px] uppercase text-ink-secondary">{statKey}</div>
                    <div className="font-bold text-ink-primary">{statVal}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border-subtle bg-canvas px-3 py-2 font-mono text-xs text-ink-secondary">
                [{lang === 'vi' ? 'CHƯA CÓ DỮ LIỆU CHỈ SỐ CHI TIẾT' : 'NO ATTRIBUTE BREAKDOWN'}]
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border border-border-strong bg-subheader p-2 font-mono text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border border-border-strong px-3 py-1.5 font-bold ${
              activeTab === tab.id
                ? 'bg-ink-primary text-white'
                : 'bg-surface text-ink-primary hover:bg-canvas'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INVENTORY & GEAR */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          {invLoading ? (
            <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
              [{lang === 'vi' ? 'ĐANG ĐỌC TÚI ĐỒ...' : 'DECODING INVENTORY...'}]
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-12">
              {/* Equipment & Inspector */}
              <div className="space-y-4 border border-border-strong bg-surface p-4 lg:col-span-5">
                <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
                  [EQUIPPED GEAR // {lang === 'vi' ? 'TRANG BỊ ĐANG MẶC' : 'ACTIVE LOADOUT'}]
                </div>

                {equipmentEntries.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {equipmentEntries.map((eq) => (
                      <div
                        key={eq.key}
                        className="flex items-center gap-2.5 border border-border-subtle bg-canvas p-2"
                      >
                        <ItemSlotCell
                          item={eq.item}
                          size="md"
                          onClick={(it) => setInspectedItem(it)}
                        />
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] font-bold text-ink-secondary">
                            {eq.label}
                          </div>
                          <div className="truncate text-xs font-semibold text-ink-primary">
                            {eq.item?.displayName || eq.item?.type || '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-border-subtle bg-canvas p-4 font-mono text-xs text-ink-secondary">
                    [{lang === 'vi' ? 'CHƯA TRANG BỊ VẬT PHẨM' : 'NO EQUIPPED ITEMS'}]
                  </div>
                )}

                {/* Item Lore Inspector */}
                {inspectedItem && (
                  <div className="border-2 border-border-strong bg-canvas p-3">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-1.5 font-mono text-xs font-bold">
                      <span>[ITEM INSPECTOR]</span>
                      <button
                        type="button"
                        onClick={() => setInspectedItem(null)}
                        className="text-ink-secondary hover:text-ink-primary"
                      >
                        [X]
                      </button>
                    </div>
                    <div className="mt-2 border-2 border-mc-tooltip-border bg-mc-tooltip-bg p-2.5 font-mono text-xs text-white">
                      <div className="font-bold text-[#55FFFF]">
                        {inspectedItem.displayName || inspectedItem.type}
                      </div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-[#AAAAAA]">
                        {(inspectedItem.lore || []).map((line, i) => (
                          <div key={i}>{line || '\u00A0'}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Inventory + Hotbar + EnderChest */}
              <div className="space-y-4 border border-border-strong bg-surface p-4 lg:col-span-7">
                <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
                  [BACKPACK &amp; HOTBAR // {lang === 'vi' ? 'TÚI ĐỒ CÁ NHÂN' : 'PLAYER STORAGE'}]
                </div>

                <div className="space-y-2 overflow-x-auto">
                  <ChestGrid
                    title={lang === 'vi' ? 'TÚI ĐỒ CHÍNH (27 Ô)' : 'MAIN INVENTORY (27 SLOTS)'}
                    items={inventoryItems}
                    slotIndices={MAIN_INVENTORY_SLOTS}
                    mode="slot"
                    onSelectItem={(it) => setInspectedItem(it)}
                  />
                  <ChestGrid
                    title={lang === 'vi' ? 'THANH PHÍM TẮT (9 Ô)' : 'HOTBAR (9 SLOTS)'}
                    items={inventoryItems}
                    slotIndices={HOTBAR_SLOTS}
                    mode="slot"
                    onSelectItem={(it) => setInspectedItem(it)}
                  />
                </div>

                {enderChestItems.length > 0 && (
                  <div className="overflow-x-auto border-t border-border-subtle pt-3">
                    <ChestGrid
                      title="ENDER CHEST (27 SLOTS)"
                      items={enderChestItems}
                      totalSlots={27}
                      mode="slot"
                      onSelectItem={(it) => setInspectedItem(it)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MOUNTS & SADDLEBAG */}
      {activeTab === 'MOUNTS' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 border border-border-strong bg-surface p-4 lg:col-span-5">
            <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
              [SADDLEBAG // {lang === 'vi' ? 'KHO YÊN THÚ CƯỠI' : 'MOUNT STORAGE'}]
            </div>

            {activeMount ? (
              <div className="space-y-3">
                <div className="border border-border-subtle bg-canvas p-3 font-mono text-xs">
                  <div className="font-bold text-ink-primary">
                    {activeMount.name || activeMount.displayName || activeMount.id}
                  </div>
                  <div className="mt-1 text-ink-secondary tabular-nums">
                    LV.{activeMount.level ?? 1} // SPD: {activeMount.speed ?? '—'} // STA:{' '}
                    {activeMount.stamina ?? '—'}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <ChestGrid
                    title={lang === 'vi' ? 'TÚI YÊN NGỰA' : 'SADDLEBAG'}
                    items={saddlebagItems}
                    totalSlots={Math.max(27, saddlebagItems.length)}
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
              rowKey={(row, idx) => row.id || idx}
              loading={mountsLoading}
            />
          </div>
        </div>
      )}

      {/* TAB 3: PROFESSIONS & QUESTS */}
      {activeTab === 'PROGRESSION' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 border border-border-strong bg-surface p-4 lg:col-span-5">
            <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
              [PROFESSIONS // {lang === 'vi' ? 'KỸ NĂNG NGHỀ NGHIỆP' : 'LIFE SKILLS'}]
            </div>

            {professionsList.length > 0 ? (
              <div className="space-y-2.5">
                {professionsList.map((prof, idx) => {
                  const pExp = Number(prof.exp ?? 0);
                  const pMax = Math.max(1, Number(prof.maxExp ?? prof.nextLevelExp ?? 100));
                  const pct = Math.min(100, Math.max(0, Math.round((pExp / pMax) * 100)));
                  return (
                    <div
                      key={prof.id || idx}
                      className="border border-border-subtle bg-canvas p-2.5 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink-primary">
                          {prof.displayName || prof.name || prof.id}
                        </span>
                        <span className="font-bold text-accent-emerald tabular-nums">
                          LV.{prof.level ?? 1}
                        </span>
                      </div>
                      <div className="mt-1.5 border border-border-strong bg-surface p-0.5">
                        <div style={{ width: `${pct}%` }} className="h-1.5 bg-accent-emerald" />
                      </div>
                      <div className="mt-1 text-right text-[10px] text-ink-secondary tabular-nums">
                        {pExp.toLocaleString()} / {pMax.toLocaleString()} EXP ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-border-subtle bg-canvas p-6 text-center font-mono text-xs text-ink-secondary">
                [{lang === 'vi' ? 'CHƯA CÓ DỮ LIỆU NGHỀ NGHIỆP' : 'NO PROFESSION DATA'}]
              </div>
            )}
          </div>

          <div className="space-y-3 lg:col-span-7">
            <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
              [QUEST LOG // {lang === 'vi' ? 'NHẬT KÝ NHIỆM VỤ' : 'QUEST TRACKER'}]
            </div>
            <DataTable
              columns={questColumns}
              rows={questsList}
              rowKey={(row, idx) => row.id || row.questId || idx}
              loading={questsLoading}
            />
          </div>
        </div>
      )}

      {/* TAB 4: WAYSTONES & FRIENDS */}
      {activeTab === 'WORLD_SOCIAL' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
              [WAYSTONES // {lang === 'vi' ? 'ĐIỂM DỊCH CHUYỂN ĐÃ MỞ' : 'UNLOCKED WAYSTONES'}]
            </div>
            <DataTable
              columns={waystoneColumns}
              rows={waystonesList}
              rowKey={(row, idx) => row.id || row.name || idx}
            />
          </div>

          <div className="space-y-3 lg:col-span-5">
            <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
              [FRIENDS // {lang === 'vi' ? 'DANH SÁCH BẠN BÈ' : 'FRIENDS ROSTER'}]
            </div>
            <DataTable
              columns={friendColumns}
              rows={friendsList}
              rowKey={(row, idx) => row.uuid || row.username || idx}
            />
          </div>
        </div>
      )}
    </div>
  );
}