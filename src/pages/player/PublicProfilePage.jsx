import { useParams, Link } from 'react-router-dom';
import { playerApi } from '../../api/services/player.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDateTime } from '../../utils/date.util';
import ItemSlotCell from '../../components/rpg/ItemSlotCell';
import PlayerBadge from '../../components/rpg/PlayerBadge';
import StatusTag from '../../components/ui/StatusTag';

function resolveStringLabel(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') {
    return value.name || value.displayName || value.rank || value.id || fallback;
  }
  return String(value);
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const { lang } = useLanguage();

  const {
    data: profile,
    loading,
    error,
  } = useAsyncData(
    () => playerApi.getPublicProfile(username),
    [username]
  );

  if (loading) {
    return (
      <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
        [{lang === 'vi' ? 'ĐANG TRA CỨU HỒ SƠ NGƯỜI CHƠI...' : 'FETCHING PUBLIC DOSSIER...'}]
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-3 border border-accent-crimson bg-surface p-6">
        <div className="font-mono text-xs font-bold text-accent-crimson">
          [ERROR // {error?.message || 'PLAYER_NOT_FOUND'}]
        </div>
        <Link
          to="/market"
          className="inline-block border border-border-strong bg-canvas px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary"
        >
          &lt; {lang === 'vi' ? 'QUAY LẠI SÀN ĐẤU GIÁ' : 'BACK TO MARKET'}
        </Link>
      </div>
    );
  }

  const rankObj =
    typeof profile.adventurerRank === 'object' && profile.adventurerRank !== null
      ? profile.adventurerRank
      : { rank: profile.adventurerRank || 'F-' };

  const playerIdentity = {
    username: profile.username || username,
    uuid: profile.uuid,
    isVip: Boolean(profile.isVip),
    adventurerRank: rankObj.rank || 'F-',
    guildTag: profile.guild?.tag || profile.guildTag,
    role: profile.role,
  };

  const activeChar =
    profile.activeCharacter ||
    profile.character ||
    (Array.isArray(profile.characters) ? profile.characters[0] : null) ||
    {};

  const classLabel = resolveStringLabel(
    activeChar.className || activeChar.rpgClass || profile.className,
    'ADVENTURER'
  ).toUpperCase();

  const equipmentRaw = activeChar.equipment || profile.equipment || {};
  const equipmentList = Array.isArray(equipmentRaw)
    ? equipmentRaw.map((item, idx) => ({
        key: item.slotName || idx,
        label: item.slotLabel || item.slotName || `SLOT #${idx + 1}`,
        item,
      }))
    : typeof equipmentRaw === 'object'
    ? Object.entries(equipmentRaw).map(([key, item]) => ({
        key,
        label: key.toUpperCase(),
        item: item && typeof item === 'object' ? item : null,
      }))
    : [];

  const professionsRaw =
    activeChar.jobs ||
    activeChar.professions ||
    profile.jobs ||
    profile.professions ||
    [];
  const professionsList = Array.isArray(professionsRaw)
    ? professionsRaw
    : Object.entries(professionsRaw).map(([id, val]) => ({
        id,
        name: id.toUpperCase(),
        ...(typeof val === 'object' ? val : { level: val }),
      }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
            [PUBLIC DOSSIER // ADVENTURER RECORD]
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <PlayerBadge player={playerIdentity} linkToProfile={false} showUuid />
            {profile.online !== undefined && (
              <StatusTag
                label={profile.online ? 'ONLINE' : 'OFFLINE'}
                variant={profile.online ? 'emerald' : 'neutral'}
              />
            )}
          </div>
        </div>

        <Link
          to="/market"
          className="border border-border-strong bg-canvas px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary hover:bg-subheader"
        >
          &lt; {lang === 'vi' ? 'SÀN ĐẤU GIÁ' : 'AUCTION MARKET'}
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 border border-border-strong bg-surface md:grid-cols-4">
        <div className="border-r border-b border-border-subtle p-3.5 md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'HẠNG MẠO HIỂM' : 'ADVENTURER RANK'}
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-ink-primary tabular-nums">
            [{rankObj.rank || 'F-'}]
            {rankObj.reputation !== undefined && (
              <span className="ml-1.5 text-xs font-normal text-ink-secondary">
                ({Number(rankObj.reputation).toLocaleString()} REP)
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-border-subtle p-3.5 md:border-r md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'LỚP // CẤP ĐỘ' : 'CLASS // LEVEL'}
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-accent-emerald tabular-nums">
            {classLabel} — LV.{activeChar.level ?? profile.level ?? 1}
          </div>
        </div>

        <div className="border-r border-border-subtle p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'BANG HỘI' : 'GUILD'}
          </div>
          <div className="mt-1 font-mono text-xs font-bold">
            {profile.guild ? (
              <Link
                to={`/guilds/${encodeURIComponent(profile.guild.id)}`}
                className="text-accent-emerald underline underline-offset-2"
              >
                {profile.guild.name} [{profile.guild.role || 'MEMBER'}]
              </Link>
            ) : (
              <span className="text-ink-secondary">
                {lang === 'vi' ? 'ĐỘC HÀNH' : 'UNAFFILIATED'}
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'HOẠT ĐỘNG GẦN NHẤT' : 'LAST SEEN'}
          </div>
          <div className="mt-1 font-mono text-xs text-ink-primary tabular-nums">
            {formatDateTime(profile.lastSeen || profile.updatedAt, lang)}
          </div>
        </div>
      </div>

      {/* Equipment & Professions */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 border border-border-strong bg-surface p-4 lg:col-span-6">
          <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
            [PUBLIC LOADOUT // {lang === 'vi' ? 'TRANG BỊ HIỂN THỊ' : 'EQUIPPED GEAR'}]
          </div>

          {equipmentList.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {equipmentList.map((eq) => (
                <div
                  key={eq.key}
                  className="flex items-center gap-2.5 border border-border-subtle bg-canvas p-2"
                >
                  <ItemSlotCell item={eq.item} size="md" />
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
            <div className="border border-border-subtle bg-canvas p-6 text-center font-mono text-xs text-ink-secondary">
              [{lang === 'vi' ? 'KHÔNG HIỂN THỊ TRANG BỊ' : 'NO PUBLIC EQUIPMENT'}]
            </div>
          )}
        </div>

        <div className="space-y-3 border border-border-strong bg-surface p-4 lg:col-span-6">
          <div className="border-b border-border-subtle pb-2 font-mono text-xs font-bold uppercase text-ink-primary">
            [JOBS // {lang === 'vi' ? 'CẤP ĐỘ NGHỀ NGHIỆP' : 'SKILL LEVELS'}]
          </div>

          {professionsList.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {professionsList.map((prof, idx) => (
                <div
                  key={prof.id || idx}
                  className="flex items-center justify-between border border-border-subtle bg-canvas px-3 py-2 font-mono text-xs"
                >
                  <span className="font-semibold text-ink-primary">
                    {prof.displayName || prof.name || prof.id}
                  </span>
                  <span className="font-bold text-accent-emerald tabular-nums">
                    LV.{prof.level ?? 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border-subtle bg-canvas p-6 text-center font-mono text-xs text-ink-secondary">
              [{lang === 'vi' ? 'CHƯA CÓ DỮ LIỆU NGHỀ NGHIỆP' : 'NO JOB RECORDS'}]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}