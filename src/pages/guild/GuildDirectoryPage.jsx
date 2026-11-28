import { Link, useNavigate } from 'react-router-dom';
import { guildApi } from '../../api/services/guild.api';
import { useQueryParams } from '../../hooks/useQueryParams';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import FilterToolbar from '../../components/ui/FilterToolbar';
import DataTable from '../../components/ui/DataTable';
import PaginationBar from '../../components/ui/PaginationBar';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../components/rpg/PlayerBadge';

export default function GuildDirectoryPage() {
  const { isAuthenticated } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const { params, updateParams, resetParams } = useQueryParams({
    q: '',
    sortBy: 'level',
    page: '1',
    limit: '20',
  });

  const { data, loading, error } = useAsyncData(
    () =>
      guildApi.getGuilds({
        q: params.q || undefined,
        sortBy: params.sortBy || 'level',
        page: params.page || 1,
        limit: params.limit || 20,
      }),
    [params.q, params.sortBy, params.page, params.limit]
  );

  const guilds = data?.items || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const columns = [
    {
      key: 'guild',
      header: lang === 'vi' ? 'BANG HỘI' : 'GUILD',
      render: (row) => (
        <div className="font-mono text-xs">
          {row.tag && (
            <span className="mr-2 border border-border-strong bg-subheader px-1.5 py-0.5 font-bold text-ink-primary">
              [{row.tag}]
            </span>
          )}
          <span className="font-sans text-sm font-bold text-ink-primary">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'level',
      header: lang === 'vi' ? 'CẤP ĐỘ' : 'LEVEL',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-accent-emerald tabular-nums">
          LV.{row.level ?? 1}
        </span>
      ),
    },
    {
      key: 'leader',
      header: lang === 'vi' ? 'BANG CHỦ' : 'LEADER',
      render: (row) => <PlayerBadge player={row.leader} />,
    },
    {
      key: 'members',
      header: lang === 'vi' ? 'THÀNH VIÊN' : 'MEMBERS',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs tabular-nums">
          {row.memberCount ?? row.membersCount ?? 0}
          {row.maxMembers ? `/${row.maxMembers}` : ''}
        </span>
      ),
    },
    {
      key: 'bankBalance',
      header: lang === 'vi' ? 'NGÂN KHỐ BANG' : 'GUILD BANK',
      align: 'right',
      render: (row) => <CurrencyDisplay currency={row.bankBalance} compact />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-emerald">
            [GUILDS // SERVER REGISTRY]
          </div>
          <h1 className="mt-0.5 text-lg font-bold text-ink-primary">
            {lang === 'vi' ? 'DANH SÁCH BANG HỘI' : 'GUILD DIRECTORY'}
          </h1>
        </div>

        {isAuthenticated && (
          <Link
            to="/guilds/me"
            className="border border-border-strong bg-accent-emerald px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:opacity-95"
          >
            {lang === 'vi' ? 'BANG HỘI CỦA TÔI >' : 'MY GUILD >'}
          </Link>
        )}
      </div>

      <FilterToolbar
        searchValue={params.q}
        onSearchChange={(q) => updateParams({ q })}
        searchPlaceholder={
          lang === 'vi' ? 'Tìm tên bang hội hoặc [TAG]...' : 'Search guild name or [TAG]...'
        }
        filters={[
          {
            key: 'sortBy',
            label: lang === 'vi' ? 'SẮP XẾP' : 'SORT',
            value: params.sortBy,
            onChange: (sortBy) => updateParams({ sortBy }),
            options: [
              { value: 'level', label: lang === 'vi' ? 'CẤP ĐỘ CAO NHẤT' : 'HIGHEST LEVEL' },
              { value: 'members', label: lang === 'vi' ? 'ĐÔNG THÀNH VIÊN' : 'MOST MEMBERS' },
            ],
          },
        ]}
        onReset={resetParams}
      />

      {error && (
        <div className="border border-accent-crimson bg-surface px-4 py-3 font-mono text-xs text-accent-crimson">
          [ERROR // {error.message}]
        </div>
      )}

      <div>
        <DataTable
          columns={columns}
          rows={guilds}
          rowKey={(row) => row.id || row._id}
          loading={loading}
          onRowClick={(row) => navigate(`/guilds/${encodeURIComponent(row.id || row._id)}`)}
        />
        <PaginationBar
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={(nextPage) => updateParams({ page: nextPage }, { resetPage: false })}
        />
      </div>
    </div>
  );
}