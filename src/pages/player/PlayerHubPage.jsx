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

const VANILLA_ARMOR_SLOTS = [
  { slot: 39, key: 'helmet', label: { vi: 'MŨ GIÁP', en: 'HELMET' } },
  { slot: 38, key: 'chestplate', label: { vi: 'ÁO GIÁP', en: 'CHESTPLATE' } },
  { slot: 37, key: 'leggings', label: { vi: 'QUẦN GIÁP', en: 'LEGGINGS' } },
  { slot: 36, key: 'boots', label: { vi: 'GIÀY GIÁP', en: 'BOOTS' } },
  { slot: 40, key: 'offHand', label: { vi: 'TAY PHỤ', en: 'OFF HAND' } },
];

// Mirror từ RPGPlayer.getRequiredExp()
function getRequiredPlayerExp(level) {
  const safeLevel = Math.max(1, Number(level || 1));
  const baseExp = 300 + safeLevel * 150 + Math.pow(safeLevel, 3.0) * 1.5;

  let stageMultiplier = 1.0;
  if (safeLevel >= 16 && safeLevel < 22) {
    stageMultiplier = 1.5;
  } else if (safeLevel >= 22 && safeLevel < 32) {
    stageMultiplier = 3.0;
  } else if (safeLevel >= 32 && safeLevel < 50) {
    stageMultiplier = 6.0;
  } else if (safeLevel >= 50 && safeLevel < 75) {
    stageMultiplier = 15.0;
  } else if (safeLevel >= 75 && safeLevel < 101) {
    stageMultiplier = 30.0;
  } else if (safeLevel >= 101 && safeLevel < 150) {
    stageMultiplier = 50.0;
  } else if (safeLevel >= 150) {
    stageMultiplier = 80.0;
  }

  return baseExp * stageMultiplier;
}

// Mirror từ JobManager.getRequiredJobExp(currentLevel)
function getRequiredJobExp(level) {
  const safeLevel = Math.max(1, Number(level || 1));
  return Math.pow(safeLevel, 2) * 50 + 500;
}

function resolveStringLabel(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') {
    return value.name || value.displayName || value.rank || value.id || fallback;
  }
  return String(value);
}

function normalizeRankDetail(rawRank) {
  if (!rawRank || typeof rawRank !== 'object') {
    return {
      rank: rawRank ? String(rawRank) : 'F-',
      reputation: 0,
      effectiveReputation: 0,
      usableReputation: 0,
      nextRank: null,
      nextRankMinRep: 0,
      remainingToNextRank: 0,
      progressPercent: 0,
    };
  }
  return {
    rank: rawRank.rank || 'F-',
    reputation: Number(rawRank.reputation ?? 0),
    effectiveReputation: Number(rawRank.effectiveReputation ?? rawRank.reputation ?? 0),
    usableReputation: Number(rawRank.usableReputation ?? 0),
    nextRank: rawRank.nextRank || null,
    nextRankMinRep: Number(rawRank.nextRankMinRep ?? 0),
    remainingToNextRank: Number(rawRank.remainingToNextRank ?? 0),
    progressPercent: Math.min(100, Math.max(0, Number(rawRank.progressPercent ?? 0))),
  };
}

function formatExpNumber(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function resolveWaystoneName(row) {
  return (
    row.name ||
    row.waystoneName ||
    row.displayName ||
    row.title ||
    row.label ||
    row.waystoneId ||
    row.id ||
    row._id ||
    'WAYSTONE'
  );
}

function resolveWaystoneCoords(row) {
  const src =
    (row.location && typeof row.location === 'object' && row.location) ||
    (row.coords && typeof row.coords === 'object' && row.coords) ||
    (row.position && typeof row.position === 'object' && row.position) ||
    row;

  return {
    world: src.world || row.world || src.dimension || 'world',
    x: Math.round(Number(src.x ?? src.posX ?? src.blockX ?? 0)),
    y: Math.round(Number(src.y ?? src.posY ?? src.blockY ?? 0)),
    z: Math.round(Number(src.z ?? src.posZ ?? src.blockZ ?? 0)),
  };
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
  const [requestedSlot, setRequestedSlot] = useState(null);
  const [selectedMountSlot, setSelectedMountSlot] = useState(null);
  const [inspectedItem, setInspectedItem] = useState(null);

  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useAsyncData(
    () => playerApi.getMyProfile(requestedSlot ? { slot: requestedSlot } : {}),
    [requestedSlot]
  );

  const activeSlotNumber = requestedSlot ?? profile?.selectedSlot ?? profile?.activeSlot ?? 1;

  const { data: invPayload, loading: invLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyInventory({ slot: activeSlotNumber })),
    [activeSlotNumber],
    { immediate: Boolean(profile) }
  );

  const { data: mountsData, loading: mountsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyMounts()),
    [activeTab],
    { immediate: Boolean(profile && activeTab === 'MOUNTS') }
  );

  const { data: jobsData, loading: jobsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyJobs()),
    [activeTab],
    { immediate: Boolean(profile && activeTab === 'PROGRESSION') }
  );

  const { data: questsData, loading: questsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyQuests()),
    [activeTab],
    { immediate: Boolean(profile && activeTab === 'PROGRESSION') }
  );

  const { data: waystonesData, loading: waystonesLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyWaystones()),
    [activeTab],
    { immediate: Boolean(profile && activeTab === 'WORLD_SOCIAL') }
  );

  const { data: friendsData, loading: friendsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyFriends()),
    [activeTab],
    { immediate: Boolean(profile && activeTab === 'WORLD_SOCIAL') }
  );

  const { data: rewardsData, loading: rewardsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyRewards()),
    [activeTab],
    { immediate: Boolean(profile && activeTab === 'REWARDS_BETS') }
  );

  const { data: betsData, loading: betsLoading } = useAsyncData(
    () => safeOptionalFetch(() => playerApi.getMyLicenseBets({ page: 1, limit: 20 })),
    [activeTab],
    { immediate: Boolean(profile && activeTab === 'REWARDS_BETS') }
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

  const rankDetail = normalizeRankDetail(profile.adventurerRank);
  const playerIdentity = {
    username: profile.username || 'Unknown',
    uuid: profile.uuid,
    isVip: Boolean(profile.isVip),
    adventurerRank: rankDetail.rank,
    guildTag: profile.guild?.tag,
    role: profile.role,
  };

  // Danh sách slot từ player.service.js (slotsSummary)
  const slotsList =
    Array.isArray(profile.slotsSummary) && profile.slotsSummary.length > 0
      ? profile.slotsSummary.filter((s) => s.isCreated || s.slot === activeSlotNumber)
      : [
          {
            slot: activeSlotNumber,
            isActive: true,
            isCreated: true,
            class: profile.class || 'commoner',
            level: profile.level ?? 1,
            currency: profile.currency,
          },
        ];

  const charClassLabel = resolveStringLabel(profile.class, 'COMMONER').toUpperCase();
  const charLevel = Number(profile.level ?? 1);
  const charExp = Number(profile.exp ?? 0);
  const charRequiredExp = Number(profile.requiredExp ?? getRequiredPlayerExp(charLevel));
  const charExpPercent = Math.min(
    100,
    Math.max(
      0,
      Number(
        profile.expProgressPercent ??
          ((charExp / Math.max(1, charRequiredExp)) * 100).toFixed(2)
      )
    )
  );
  const charResource = Number(profile.resource ?? 100);
  const elementsList = Array.isArray(profile.elements) ? profile.elements : [];

  const statsObj = profile.attributes || {};
  const statEntries = Object.entries(statsObj).filter(
    ([, val]) => typeof val === 'number' || typeof val === 'string'
  );

  // Dữ liệu túi đồ từ GET /players/me/inventory (vanillaInventory, enderChest, trinkets, backpacks)
  const vanillaInventory = Array.isArray(invPayload?.vanillaInventory)
    ? invPayload.vanillaInventory
    : [];
  const enderChestItems = Array.isArray(invPayload?.enderChest) ? invPayload.enderChest : [];
  const trinketsList = Array.isArray(invPayload?.trinkets) ? invPayload.trinkets : [];
  const backpacksList = Array.isArray(invPayload?.backpacks) ? invPayload.backpacks : [];

  const vanillaSlotMap = new Map(
    vanillaInventory.map((item) => [Number(item.slot), item])
  );

  const equippedArmorEntries = VANILLA_ARMOR_SLOTS.map((def) => ({
    key: def.key,
    label: def.label[lang],
    item: vanillaSlotMap.get(def.slot) || null,
  }));

  const equippedTrinketEntries = trinketsList.map((item, idx) => ({
    key: `trinket_${item.slot ?? idx}`,
    label: String(item.tags?.trinket_type || `TRINKET #${idx + 1}`).toUpperCase(),
    item,
  }));

  // Dữ liệu thú cưỡi từ GET /players/me/mounts
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

  // Dữ liệu nghề nghiệp từ GET /players/me/jobs (mirror công thức JobManager.java)
  const jobsMapObj =
    jobsData?.jobs && typeof jobsData.jobs === 'object' ? jobsData.jobs : {};
  const professionsList = Object.entries(jobsMapObj).map(([jobId, info]) => {
    const level = Number(info?.level ?? 1);
    const exp = Number(info?.exp ?? 0);
    const requiredExp = Number(info?.requiredExp ?? getRequiredJobExp(level));
    const progressPercent = Math.min(
      100,
      Math.max(0, Number(info?.progressPercent ?? ((exp / requiredExp) * 100).toFixed(1)))
    );

    return {
      id: jobId,
      name: jobId.toUpperCase(),
      isCurrent: String(jobsData?.currentJob || '').toUpperCase() === jobId.toUpperCase(),
      level,
      exp,
      requiredExp,
      progressPercent,
      points: Number(info?.points ?? 0),
      unlockedSkillsCount: Array.isArray(info?.unlockedSkills) ? info.unlockedSkills.length : 0,
    };
  });

  // Dữ liệu nhiệm vụ từ GET /players/me/quests
  const questRows = (() => {
    if (!questsData) return [];
    const rows = [];
    const activeQuestsObj =
      questsData.activeQuests && typeof questsData.activeQuests === 'object'
        ? questsData.activeQuests
        : {};
    for (const [qId, qVal] of Object.entries(activeQuestsObj)) {
      rows.push({
        id: `active_${qId}`,
        title: typeof qVal === 'object' ? qVal.title || qVal.name || qId : qId,
        category: 'ACTIVE QUEST',
        progressText:
          typeof qVal === 'object' && qVal.progress !== undefined
            ? `${qVal.progress}${qVal.target ? ` / ${qVal.target}` : ''}`
            : String(qVal ?? 'IN PROGRESS'),
        status: 'ACTIVE',
      });
    }

    const activeBountiesObj =
      questsData.activeBounties && typeof questsData.activeBounties === 'object'
        ? questsData.activeBounties
        : {};
    for (const [bId, bVal] of Object.entries(activeBountiesObj)) {
      rows.push({
        id: `bounty_${bId}`,
        title: typeof bVal === 'object' ? bVal.zoneName || bId : bId,
        category: 'BOUNTY HUNT',
        progressText: typeof bVal === 'object' ? JSON.stringify(bVal) : String(bVal ?? 'ACTIVE'),
        status: 'BOUNTY',
      });
    }

    for (const storyId of questsData.completedStoryQuests || []) {
      rows.push({
        id: `story_${storyId}`,
        title: storyId,
        category: 'STORY QUEST',
        progressText: lang === 'vi' ? 'HOÀN TẤT' : 'DONE',
        status: 'COMPLETED',
      });
    }

    for (const dynId of questsData.completedDynamicQuests || []) {
      rows.push({
        id: `dyn_${dynId}`,
        title: dynId,
        category: 'DYNAMIC QUEST',
        progressText: lang === 'vi' ? 'HOÀN TẤT' : 'DONE',
        status: 'COMPLETED',
      });
    }

    return rows;
  })();

  // Dữ liệu Waystones & Friends
  const waystonesList = Array.isArray(waystonesData?.waystones)
    ? waystonesData.waystones
    : Array.isArray(waystonesData?.items)
    ? waystonesData.items
    : Array.isArray(waystonesData)
    ? waystonesData
    : [];

  const friendsList = Array.isArray(friendsData?.friends) ? friendsData.friends : [];
  const pendingFriendsCount = Number(friendsData?.totalPendingRequests ?? 0);

  // Dữ liệu Hòm thưởng từ GET /players/me/rewards
  const rewardRows = (() => {
    if (!rewardsData) return [];
    const rows = [];
    for (const bounty of rewardsData.bountyRewards?.pendingList || []) {
      rows.push({
        id: `bounty_${bounty.bountyId}`,
        type: 'BOUNTY REWARD',
        title: bounty.zoneName || bounty.bountyId,
        detail: `+${Number(bounty.reputation || 0).toLocaleString()} REP`,
        coins: bounty.coins,
        status: 'UNCLAIMED',
      });
    }
    for (const kit of rewardsData.kits || []) {
      rows.push({
        id: `kit_${kit.kitName}`,
        type: 'VIP / DAILY KIT',
        title: `KIT: ${String(kit.kitName).toUpperCase()}`,
        detail: kit.canClaim
          ? lang === 'vi'
            ? 'Sẵn sàng nhận trong game'
            : 'Ready to claim in-game'
          : `${Math.ceil(Number(kit.remainingMs || 0) / 60000)}m cooldown`,
        coins: null,
        status: kit.canClaim ? 'AVAILABLE' : 'COOLDOWN',
      });
    }
    return rows;
  })();

  const betsList = Array.isArray(betsData?.items) ? betsData.items : [];

  const tabs = [
    { id: 'INVENTORY', label: lang === 'vi' ? 'TÚI ĐỒ & TRANG BỊ' : 'INVENTORY & GEAR' },
    { id: 'MOUNTS', label: lang === 'vi' ? 'THÚ CƯỠI & KHO YÊN' : 'MOUNTS & SADDLEBAG' },
    { id: 'PROGRESSION', label: lang === 'vi' ? 'NGHỀ NGHIỆP & NHIỆM VỤ' : 'JOBS & QUESTS' },
    { id: 'WORLD_SOCIAL', label: lang === 'vi' ? 'WAYSTONE & BẠN BÈ' : 'WAYSTONES & FRIENDS' },
    { id: 'REWARDS_BETS', label: lang === 'vi' ? 'HÒM THƯỞNG & VÉ CƯỢC' : 'REWARDS & BETS' },
  ];

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

  const questColumns = [
    {
      key: 'quest',
      header: lang === 'vi' ? 'NHIỆM VỤ' : 'QUEST',
      render: (row) => (
        <div>
          <div className="font-mono text-[10px] font-bold text-ink-secondary">{row.category}</div>
          <div className="font-semibold text-ink-primary">{row.title}</div>
        </div>
      ),
    },
    {
      key: 'progress',
      header: lang === 'vi' ? 'TIẾN ĐỘ' : 'PROGRESS',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-semibold tabular-nums">{row.progressText}</span>
      ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => (
        <StatusTag
          label={row.status}
          variant={row.status === 'COMPLETED' ? 'emerald' : 'amber'}
        />
      ),
    },
  ];

  const waystoneColumns = [
    {
      key: 'name',
      header: lang === 'vi' ? 'ĐIỂM DỊCH CHUYỂN' : 'WAYSTONE NAME',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-ink-primary">
          {resolveWaystoneName(row)}
        </span>
      ),
    },
    {
      key: 'world',
      header: lang === 'vi' ? 'THẾ GIỚI' : 'WORLD',
      render: (row) => {
        const coords = resolveWaystoneCoords(row);
        return <span className="font-mono text-xs text-ink-secondary">{coords.world}</span>;
      },
    },
    {
      key: 'coords',
      header: lang === 'vi' ? 'TỌA ĐỘ (X / Y / Z)' : 'COORDINATES (X / Y / Z)',
      align: 'right',
      render: (row) => {
        const c = resolveWaystoneCoords(row);
        return (
          <span className="font-mono text-xs font-semibold text-accent-emerald tabular-nums">
            {c.x} / {c.y} / {c.z}
          </span>
        );
      },
    },
  ];

  const friendColumns = [
    {
      key: 'friend',
      header: lang === 'vi' ? 'NGƯỜI CHƠI' : 'PLAYER',
      render: (row) => <PlayerBadge player={row} />,
    },
    {
      key: 'classLevel',
      header: lang === 'vi' ? 'NHÂN VẬT' : 'CHARACTER',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-ink-secondary tabular-nums">
          {String(row.class || 'COMMONER').toUpperCase()} LV.{row.level ?? 1}
        </span>
      ),
    },
  ];

  const rewardColumns = [
    {
      key: 'title',
      header: lang === 'vi' ? 'PHẦN THƯỞNG' : 'REWARD',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="text-[10px] font-bold text-ink-secondary">{row.type}</div>
          <div className="font-bold text-ink-primary">{row.title}</div>
          <div className="text-[11px] text-ink-secondary">{row.detail}</div>
        </div>
      ),
    },
    {
      key: 'coins',
      header: lang === 'vi' ? 'TIỀN THƯỞNG' : 'COINS',
      align: 'right',
      render: (row) =>
        row.coins ? (
          <CurrencyDisplay currency={row.coins} compact />
        ) : (
          <span className="font-mono text-xs text-ink-secondary">—</span>
        ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => (
        <StatusTag
          label={row.status}
          variant={
            row.status === 'UNCLAIMED' || row.status === 'AVAILABLE' ? 'emerald' : 'neutral'
          }
        />
      ),
    },
  ];

  const betColumns = [
    {
      key: 'item',
      header: lang === 'vi' ? 'KÈO GIẤY PHÉP' : 'LICENSE POOL',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">{row.itemDisplayName || row.itemId}</div>
          <div className="text-[11px] text-ink-secondary">
            {lang === 'vi' ? 'Đặt vào: ' : 'Pick: '}
            <strong className="text-ink-primary">{row.candidateUsername}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: lang === 'vi' ? 'TIỀN CƯỢC' : 'STAKE',
      align: 'right',
      render: (row) => <CurrencyDisplay currency={row.formattedAmount || row.amount} compact />,
    },
    {
      key: 'payout',
      header: lang === 'vi' ? 'THƯỞNG NHẬN' : 'PAYOUT',
      align: 'right',
      render: (row) =>
        row.payoutAmount > 0 ? (
          <CurrencyDisplay
            currency={row.formattedPayoutAmount || row.payoutAmount}
            compact
          />
        ) : (
          <span className="font-mono text-xs text-ink-secondary">—</span>
        ),
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'KẾT QUẢ' : 'RESULT',
      align: 'right',
      render: (row) => {
        const st = String(row.status || '').toUpperCase();
        const variant =
          st === 'WON'
            ? 'emerald'
            : st === 'LOST' || st === 'FAILED'
            ? 'crimson'
            : st === 'REFUNDED'
            ? 'amber'
            : 'neutral';
        return (
          <div className="space-y-1 font-mono text-xs">
            <div>
              <StatusTag label={st} variant={variant} />
            </div>
            <div className="text-[10px] text-ink-secondary">
              {formatDateTime(row.settledAt || row.createdAt, lang)}
            </div>
          </div>
        );
      },
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
            {lang === 'vi' ? 'NGÂN KHỐ SLOT HIỆN TẠI' : 'SLOT WALLET BALANCE'}
          </div>
          <div className="mt-1">
            <CurrencyDisplay currency={profile.currency || 0} />
          </div>
        </div>

        <div className="border-b border-border-subtle p-3.5 md:border-r md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'BANG HỘI HIỆN TẠI' : 'GUILD AFFILIATION'}
          </div>
          <div className="mt-1 font-mono text-xs font-bold">
            {profile.guild ? (
              <Link
                to="/guilds/me"
                className="text-accent-emerald underline underline-offset-2"
              >
                {profile.guild.name} [{profile.guild.role || 'MEMBER'}]
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
            {lang === 'vi' ? 'HẠNG MẠO HIỂM // DANH VỌNG' : 'ADVENTURER RANK // REP'}
          </div>
          <div className="mt-1 space-y-1 font-mono text-xs tabular-nums">
            <div className="font-bold text-ink-primary">
              [{rankDetail.rank}] — {rankDetail.reputation.toLocaleString()} REP
              {rankDetail.nextRank ? ` -> [${rankDetail.nextRank}]` : ''}
            </div>
            {rankDetail.nextRank && (
              <div className="border border-border-strong bg-canvas p-0.5">
                <div
                  style={{ width: `${rankDetail.progressPercent}%` }}
                  className="h-1 bg-accent-amber"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'NGUYÊN TỐ // NĂNG LƯỢNG' : 'ELEMENTS // RESOURCE'}
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-ink-primary tabular-nums">
            RES: {charResource}
            {elementsList.length > 0 ? ` // ${elementsList.join(', ').toUpperCase()}` : ''}
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
            {slotsList.map((s) => {
              const isSelected = Number(s.slot) === Number(activeSlotNumber);
              const slotClass = resolveStringLabel(s.class, 'CHAR').toUpperCase();
              return (
                <button
                  key={s.slot}
                  type="button"
                  onClick={() => {
                    setRequestedSlot(Number(s.slot));
                    setInspectedItem(null);
                  }}
                  className={`border border-border-strong px-2.5 py-1 font-semibold tabular-nums ${
                    isSelected
                      ? 'bg-ink-primary text-white'
                      : 'bg-canvas text-ink-primary hover:bg-subheader'
                  }`}
                >
                  SLOT #{s.slot} ({slotClass} LV.{s.level ?? 1})
                </button>
              );
            })}
          </div>
        </div>

        {/* EXP Progress Bar (RPGPlayer.getRequiredExp mirror) & Attributes */}
        <div className="mt-3 grid gap-4 md:grid-cols-12">
          <div className="space-y-1.5 md:col-span-5">
            <div className="border border-border-subtle bg-canvas p-3 font-mono text-xs tabular-nums">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-primary">
                  {charClassLabel} — LEVEL {charLevel}
                </span>
                <span className="font-bold text-accent-emerald">{charExpPercent}%</span>
              </div>

              <div className="mt-1.5 border border-border-strong bg-surface p-0.5">
                <div
                  style={{ width: `${charExpPercent}%` }}
                  className="h-2 bg-accent-emerald"
                />
              </div>

              <div className="mt-1.5 text-[11px] text-ink-secondary">
                EXP: <strong className="text-ink-primary">{formatExpNumber(charExp)}</strong> /{' '}
                {formatExpNumber(charRequiredExp)}
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            {statEntries.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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
              {/* Equipped Armor, Offhand & Trinkets */}
              <div className="space-y-4 border border-border-strong bg-surface p-4 lg:col-span-5">
                <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
                  [EQUIPPED GEAR // {lang === 'vi' ? 'TRANG BỊ & PHỤ KIỆN' : 'ARMOR & TRINKETS'}]
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {[...equippedArmorEntries, ...equippedTrinketEntries].map((eq) => (
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

              {/* Vanilla Main Inventory + Hotbar + EnderChest + Backpacks */}
              <div className="space-y-4 border border-border-strong bg-surface p-4 lg:col-span-7">
                <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
                  [BACKPACK &amp; HOTBAR // {lang === 'vi' ? 'TÚI ĐỒ CÁ NHÂN' : 'PLAYER STORAGE'}]
                </div>

                <div className="space-y-2 overflow-x-auto">
                  <ChestGrid
                    title={lang === 'vi' ? 'TÚI ĐỒ CHÍNH (27 Ô)' : 'MAIN INVENTORY (27 SLOTS)'}
                    items={vanillaInventory}
                    slotIndices={MAIN_INVENTORY_SLOTS}
                    mode="slot"
                    onSelectItem={(it) => setInspectedItem(it)}
                  />
                  <ChestGrid
                    title={lang === 'vi' ? 'THANH PHÍM TẮT (9 Ô)' : 'HOTBAR (9 SLOTS)'}
                    items={vanillaInventory}
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

                {backpacksList.length > 0 && (
                  <div className="space-y-3 border-t border-border-subtle pt-3">
                    <div className="font-mono text-xs font-bold uppercase text-ink-secondary">
                      [BACKPACKS // {lang === 'vi' ? 'BA LÔ MANG THEO' : 'NESTED BACKPACKS'}]
                    </div>
                    {backpacksList.map((bag) => (
                      <div key={bag.bagUuid} className="overflow-x-auto">
                        <ChestGrid
                          title={`${bag.bagName} (${bag.parentLocation} #${bag.locatedAtSlot})`}
                          items={bag.items || []}
                          totalSlots={Math.max(9, Number(bag.capacity || bag.items?.length || 27))}
                          mode="slot"
                          onSelectItem={(it) => setInspectedItem(it)}
                        />
                      </div>
                    ))}
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
                    SLOT #{activeMount.slot} — {activeMount.customName || activeMount.type}
                  </div>
                  <div className="mt-1 text-ink-secondary tabular-nums">
                    SPD T{activeMount.tiers?.speed ?? 0} // JMP T{activeMount.tiers?.jump ?? 0} //
                    DUR T{activeMount.tiers?.durability ?? 0} // BAG T
                    {activeMount.tiers?.storage ?? 0}
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
      )}

      {/* TAB 3: JOBS & QUESTS */}
      {activeTab === 'PROGRESSION' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 border border-border-strong bg-surface p-4 lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2 font-mono text-xs">
              <span className="font-bold uppercase text-ink-primary">
                [JOBS // {lang === 'vi' ? 'KỸ NĂNG NGHỀ NGHIỆP' : 'LIFE SKILLS'}]
              </span>
              {jobsData && (
                <span className="text-[11px] text-ink-secondary tabular-nums">
                  SCRAPS: <strong>{Number(jobsData.scraps || 0).toLocaleString()}</strong>
                </span>
              )}
            </div>

            {jobsLoading ? (
              <div className="border border-border-subtle bg-canvas p-6 text-center font-mono text-xs text-ink-secondary">
                [{lang === 'vi' ? 'ĐANG TẢI NGHỀ NGHIỆP...' : 'LOADING JOBS...'}]
              </div>
            ) : professionsList.length > 0 ? (
              <div className="space-y-2.5">
                {professionsList.map((prof) => (
                  <div
                    key={prof.id}
                    className="border border-border-subtle bg-canvas p-3 font-mono text-xs tabular-nums"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink-primary">{prof.name}</span>
                        {prof.isCurrent && <StatusTag label="ACTIVE" variant="emerald" />}
                      </div>
                      <span className="font-bold text-accent-emerald">LV.{prof.level}</span>
                    </div>

                    <div className="mt-1.5 border border-border-strong bg-surface p-0.5">
                      <div
                        style={{ width: `${prof.progressPercent}%` }}
                        className="h-1.5 bg-accent-emerald"
                      />
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-secondary">
                      <span>
                        {formatExpNumber(prof.exp)} / {formatExpNumber(prof.requiredExp)} EXP (
                        {prof.progressPercent}%)
                      </span>
                      <span>
                        JP: <strong className="text-ink-primary">{prof.points}</strong> (
                        {prof.unlockedSkillsCount} {lang === 'vi' ? 'kỹ năng' : 'skills'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border-subtle bg-canvas p-6 text-center font-mono text-xs text-ink-secondary">
                [{lang === 'vi' ? 'CHƯA CÓ DỮ LIỆU NGHỀ NGHIỆP' : 'NO JOB DATA'}]
              </div>
            )}
          </div>

          <div className="space-y-3 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs">
              <span className="font-bold uppercase text-ink-primary">
                [QUEST LOG // {lang === 'vi' ? 'NHẬT KÝ NHIỆM VỤ' : 'QUEST TRACKER'}]
              </span>
              {questsData && (
                <span className="text-[11px] text-ink-secondary tabular-nums">
                  DAILY: {questsData.daily?.completed ?? 0} // WEEKLY PTS:{' '}
                  {questsData.weekly?.points ?? 0}
                </span>
              )}
            </div>
            <DataTable
              columns={questColumns}
              rows={questRows}
              rowKey="id"
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
              rowKey={(row, idx) => row.id || row._id || idx}
              loading={waystonesLoading}
            />
          </div>

          <div className="space-y-3 lg:col-span-5">
            <div className="flex items-center justify-between border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs">
              <span className="font-bold uppercase text-ink-primary">
                [FRIENDS // {lang === 'vi' ? 'DANH SÁCH BẠN BÈ' : 'FRIENDS ROSTER'}]
              </span>
              {pendingFriendsCount > 0 && (
                <StatusTag
                  label={
                    lang === 'vi'
                      ? `${pendingFriendsCount} LỜI MỜI`
                      : `${pendingFriendsCount} PENDING`
                  }
                  variant="amber"
                />
              )}
            </div>
            <DataTable
              columns={friendColumns}
              rows={friendsList}
              rowKey={(row) => row.uuid || row.username}
              loading={friendsLoading}
            />
          </div>
        </div>
      )}

      {/* TAB 5: REWARDS & LICENSE BETS */}
      {activeTab === 'REWARDS_BETS' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs">
              <span className="font-bold uppercase text-ink-primary">
                [REWARDS // {lang === 'vi' ? 'HÒM THƯỞNG & ĐIỂM DANH' : 'REWARDS & CHECK-IN'}]
              </span>
              {rewardsData?.monthlyCheckIn && (
                <span className="text-[11px] font-bold text-accent-emerald tabular-nums">
                  CHECK-IN: {rewardsData.monthlyCheckIn.currentProgress}/
                  {rewardsData.monthlyCheckIn.maxDays}
                </span>
              )}
            </div>
            <DataTable
              columns={rewardColumns}
              rows={rewardRows}
              rowKey="id"
              loading={rewardsLoading}
            />
          </div>

          <div className="space-y-3 lg:col-span-7">
            <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
              [LICENSE BETS // {lang === 'vi' ? 'LỊCH SỬ CƯỢC GIẤY PHÉP' : 'MY LICENSE BETS'}]
            </div>
            <DataTable
              columns={betColumns}
              rows={betsList}
              rowKey={(row, idx) => row.betId || idx}
              loading={betsLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}