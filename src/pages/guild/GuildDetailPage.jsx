import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { guildApi } from '../../api/services/guild.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useDebounce } from '../../hooks/useDebounce';
import { useLanguage } from '../../hooks/useLanguage';
import ChestGrid from '../../components/rpg/ChestGrid';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../components/rpg/PlayerBadge';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';

// 52 slot hợp lệ của rương đôi Minecraft 54 ô (loại bỏ slot 45 và 53 là nút chuyển trang GUI)
const GUILD_VAULT_SLOT_INDICES = [
  ...Array.from({ length: 45 }, (_, i) => i),
  ...Array.from({ length: 7 }, (_, i) => 46 + i),
];

export default function GuildDetailPage({ isMe = false }) {
  const { id } = useParams();
  const { lang } = useLanguage();

  const [vaultPage, setVaultPage] = useState(1);
  const [vaultQuery, setVaultQuery] = useState('');
  const debouncedVaultQuery = useDebounce(vaultQuery, 350);

  const {
    data: guild,
    loading: guildLoading,
    error: guildError,
  } = useAsyncData(
    () => (isMe ? guildApi.getMyGuild() : guildApi.getGuildById(id)),
    [isMe, id]
  );

  const {
    data: vaultData,
    loading: vaultLoading,
    error: vaultError,
  } = useAsyncData(
    () => {
      const trimmedQ = debouncedVaultQuery.trim();
      const query = trimmedQ ? { pages: 'all', q: trimmedQ } : { page: vaultPage };
      return isMe ? guildApi.getMyGuildVault(query) : guildApi.getGuildVault(id, query);
    },
    [isMe, id, vaultPage, debouncedVaultQuery]
  );

  if (guildLoading) {
    return (
      <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
        [{lang === 'vi' ? 'ĐANG TẢI THÔNG TIN BANG HỘI...' : 'LOADING GUILD PROFILE...'}]
      </div>
    );
  }

  if (guildError || !guild) {
    return (
      <div className="space-y-3 border border-accent-crimson bg-surface p-6">
        <div className="font-mono text-xs font-bold text-accent-crimson">
          [ERROR // {guildError?.message || 'GUILD_NOT_FOUND'}]
        </div>
        <Link
          to="/guilds"
          className="inline-block border border-border-strong bg-canvas px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary"
        >
          &lt; {lang === 'vi' ? 'QUAY LẠI DANH SÁCH BANG' : 'BACK TO GUILDS'}
        </Link>
      </div>
    );
  }

  const members = Array.isArray(guild.members) ? guild.members : [];
  const leaderEntity =
    members.find((m) => String(m.guildRole).toUpperCase() === 'LEADER') || null;

  const totalVaultPages = Math.max(
    1,
    Number(
      vaultData?.vaultSummary?.totalPages ??
        guild.vaultSummary?.totalPages ??
        guild.vaultPagesCount ??
        1
    ) || 1
  );

  const pagesOverview =
    vaultData?.vaultSummary?.pagesOverview || guild.vaultSummary?.pagesOverview || [];

  const isSearchMode = vaultData?.mode === 'SEARCH';
  const currentVaultPageObj = !isSearchMode
    ? (vaultData?.vaults || []).find((v) => Number(v.page) === vaultPage) ||
      vaultData?.vaults?.[0]
    : null;

  const vaultItems = isSearchMode
    ? vaultData?.items || []
    : currentVaultPageObj?.items || [];

  const memberColumns = [
    {
      key: 'member',
      header: lang === 'vi' ? 'THÀNH VIÊN' : 'MEMBER',
      render: (row) => <PlayerBadge player={row} />,
    },
    {
      key: 'guildRole',
      header: lang === 'vi' ? 'CHỨC VỤ' : 'GUILD ROLE',
      align: 'right',
      render: (row) => {
        const role = String(row.guildRole || 'MEMBER').toUpperCase();
        return (
          <StatusTag
            label={role}
            variant={
              role === 'LEADER'
                ? 'emerald'
                : role === 'VICE_LEADER'
                ? 'amber'
                : 'neutral'
            }
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Guild Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-ink-primary">{guild.name}</h1>
            <StatusTag label={`LV.${guild.level ?? 1}`} variant="emerald" />
            {guild.hasIsland && (
              <StatusTag
                label={lang === 'vi' ? `ĐẢO BANG #${guild.islandId}` : `ISLAND #${guild.islandId}`}
                variant="neutral"
              />
            )}
          </div>
          <div className="mt-1 font-mono text-xs text-ink-secondary tabular-nums">
            EXP: {Number(guild.exp || 0).toLocaleString()}
          </div>
        </div>

        <Link
          to="/guilds"
          className="border border-border-strong bg-canvas px-3 py-1.5 font-mono text-xs font-semibold text-ink-primary hover:bg-subheader"
        >
          &lt; {lang === 'vi' ? 'DANH SÁCH BANG' : 'GUILD DIRECTORY'}
        </Link>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 border border-border-strong bg-surface md:grid-cols-4">
        <div className="border-r border-b border-border-subtle p-3.5 md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'BANG CHỦ' : 'LEADER'}
          </div>
          <div className="mt-1">
            <PlayerBadge player={leaderEntity} />
          </div>
        </div>

        <div className="border-b border-border-subtle p-3.5 md:border-r md:border-b-0">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'QUÂN SỐ' : 'ROSTER'}
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-ink-primary tabular-nums">
            {guild.memberCount ?? members.length} / {guild.maxMembers ?? 20}
          </div>
        </div>

        <div className="border-r border-border-subtle p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'NGÂN KHỐ BANG' : 'BANK BALANCE'}
          </div>
          <div className="mt-1">
            {guild.accessLevel === 'PUBLIC' ? (
              <span className="font-mono text-xs text-ink-secondary">
                [{lang === 'vi' ? 'NỘI BỘ BANG' : 'MEMBERS ONLY'}]
              </span>
            ) : (
              <CurrencyDisplay currency={guild.bankBalance} />
            )}
          </div>
        </div>

        <div className="p-3.5">
          <div className="font-mono text-[11px] uppercase text-ink-secondary">
            {lang === 'vi' ? 'KHO BANG MỞ KHÓA' : 'UNLOCKED VAULT'}
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-accent-emerald tabular-nums">
            {totalVaultPages} {lang === 'vi' ? 'TRANG (52 Ô/TRANG)' : 'PAGES (52 SLOTS/PG)'}
          </div>
        </div>
      </div>

      {/* Vault & Roster Split */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 border border-border-strong bg-surface p-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
            <div className="font-mono text-xs font-bold uppercase text-ink-primary">
              [GUILD VAULT // {lang === 'vi' ? 'RƯƠNG BANG HỘI' : 'SHARED STORAGE'}]
            </div>

            <input
              type="text"
              value={vaultQuery}
              onChange={(e) => {
                setVaultQuery(e.target.value);
                setVaultPage(1);
              }}
              placeholder={lang === 'vi' ? 'Lọc vật phẩm trong rương...' : 'Filter vault items...'}
              className="border border-border-strong bg-canvas px-2.5 py-1 font-mono text-xs text-ink-primary outline-none"
            />
          </div>

          {!debouncedVaultQuery.trim() && (
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {Array.from({ length: totalVaultPages }, (_, i) => i + 1).map((pg) => {
                const overview = pagesOverview.find((o) => Number(o.page) === pg);
                const countBadge = overview ? ` (${overview.usedSlots}/${overview.capacity})` : '';
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setVaultPage(pg)}
                    className={`border border-border-strong px-2.5 py-1 font-semibold tabular-nums ${
                      vaultPage === pg
                        ? 'bg-ink-primary text-white'
                        : 'bg-canvas text-ink-primary hover:bg-subheader'
                    }`}
                  >
                    {lang === 'vi' ? `TRANG ${pg}${countBadge}` : `PAGE ${pg}${countBadge}`}
                  </button>
                );
              })}
            </div>
          )}

          {vaultError ? (
            <div className="border border-accent-crimson bg-canvas p-4 font-mono text-xs text-accent-crimson">
              [403 // {vaultError.message}]
            </div>
          ) : vaultLoading ? (
            <div className="border border-border-subtle bg-canvas p-8 text-center font-mono text-xs text-ink-secondary">
              [{lang === 'vi' ? 'ĐANG MỞ RƯƠNG BANG...' : 'OPENING GUILD VAULT...'}]
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ChestGrid
                title={
                  isSearchMode
                    ? `${lang === 'vi' ? 'KẾT QUẢ TÌM KIẾM' : 'SEARCH RESULT'}`
                    : `VAULT PAGE #${vaultPage}`
                }
                items={vaultItems}
                totalSlots={isSearchMode ? Math.max(52, vaultItems.length) : 52}
                slotIndices={isSearchMode ? null : GUILD_VAULT_SLOT_INDICES}
                mode={isSearchMode ? 'sequential' : 'slot'}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 lg:col-span-5">
          <div className="border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-ink-primary">
            [ROSTER // {lang === 'vi' ? 'DANH SÁCH THÀNH VIÊN' : 'GUILD MEMBERS'}]
          </div>
          <DataTable
            columns={memberColumns}
            rows={members}
            rowKey={(row) => row.uuid || row.username}
          />
        </div>
      </div>
    </div>
  );
}