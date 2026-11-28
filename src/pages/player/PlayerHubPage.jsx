import { useState } from 'react';
import { playerApi } from '../../api/services/player.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import PlayerHeaderKpi from './components/PlayerHeaderKpi';
import PlayerInventoryTab from './components/PlayerInventoryTab';
import PlayerMountsTab from './components/PlayerMountsTab';
import PlayerProgressionTab from './components/PlayerProgressionTab';
import PlayerWorldSocialTab from './components/PlayerWorldSocialTab';
import PlayerRewardsBetsTab from './components/PlayerRewardsBetsTab';

function getRequiredPlayerExp(level) {
  const safeLevel = Math.max(1, Number(level || 1));
  const baseExp = 300 + safeLevel * 150 + Math.pow(safeLevel, 3.0) * 1.5;

  let stageMultiplier = 1.0;
  if (safeLevel >= 16 && safeLevel < 22) stageMultiplier = 1.5;
  else if (safeLevel >= 22 && safeLevel < 32) stageMultiplier = 3.0;
  else if (safeLevel >= 32 && safeLevel < 50) stageMultiplier = 6.0;
  else if (safeLevel >= 50 && safeLevel < 75) stageMultiplier = 15.0;
  else if (safeLevel >= 75 && safeLevel < 101) stageMultiplier = 30.0;
  else if (safeLevel >= 101 && safeLevel < 150) stageMultiplier = 50.0;
  else if (safeLevel >= 150) stageMultiplier = 80.0;

  return baseExp * stageMultiplier;
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

export default function PlayerHubPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('INVENTORY');
  const [requestedSlot, setRequestedSlot] = useState(null);

  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useAsyncData(
    () => playerApi.getMyProfile(requestedSlot ? { slot: requestedSlot } : {}),
    [requestedSlot]
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

  const activeSlotNumber = requestedSlot ?? profile.selectedSlot ?? profile.activeSlot ?? 1;
  const rankDetail = normalizeRankDetail(profile.adventurerRank);
  const playerIdentity = {
    username: profile.username || 'Unknown',
    uuid: profile.uuid,
    isVip: Boolean(profile.isVip),
    adventurerRank: rankDetail.rank,
    guildTag: profile.guild?.tag,
    role: profile.role,
  };

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

  const tabs = [
    { id: 'INVENTORY', label: lang === 'vi' ? 'TÚI ĐỒ & TRANG BỊ' : 'INVENTORY & GEAR' },
    { id: 'MOUNTS', label: lang === 'vi' ? 'THÚ CƯỠI & KHO YÊN' : 'MOUNTS & SADDLEBAG' },
    { id: 'PROGRESSION', label: lang === 'vi' ? 'NGHỀ NGHIỆP & NHIỆM VỤ' : 'JOBS & QUESTS' },
    { id: 'WORLD_SOCIAL', label: lang === 'vi' ? 'WAYSTONE & BẠN BÈ' : 'WAYSTONES & FRIENDS' },
    { id: 'REWARDS_BETS', label: lang === 'vi' ? 'HÒM THƯỞNG & VÉ CƯỢC' : 'REWARDS & BETS' },
  ];

  return (
    <div className="space-y-4">
      <PlayerHeaderKpi
        profile={profile}
        playerIdentity={playerIdentity}
        rankDetail={rankDetail}
        charResource={charResource}
        elementsList={elementsList}
        lang={lang}
      />

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
                  onClick={() => setRequestedSlot(Number(s.slot))}
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

      {activeTab === 'INVENTORY' && (
        <PlayerInventoryTab activeSlotNumber={activeSlotNumber} lang={lang} />
      )}
      {activeTab === 'MOUNTS' && <PlayerMountsTab lang={lang} />}
      {activeTab === 'PROGRESSION' && <PlayerProgressionTab lang={lang} />}
      {activeTab === 'WORLD_SOCIAL' && <PlayerWorldSocialTab lang={lang} />}
      {activeTab === 'REWARDS_BETS' && <PlayerRewardsBetsTab lang={lang} />}
    </div>
  );
}