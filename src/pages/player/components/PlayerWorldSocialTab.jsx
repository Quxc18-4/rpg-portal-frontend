import { playerApi } from '../../../api/services/player.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import PlayerBadge from '../../../components/rpg/PlayerBadge';
import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

const WORLD_LABELS = {
  world: 'OVERWORLD',
  world_nether: 'THE NETHER',
  world_the_end: 'THE END',
};

function formatWorldName(rawWorld) {
  const key = String(rawWorld || 'world').toLowerCase();
  return WORLD_LABELS[key] || key.toUpperCase();
}

export default function PlayerWorldSocialTab({ lang }) {
  const { data: waystonesData, loading: waystonesLoading } = useAsyncData(async () => {
    try {
      return await playerApi.getMyWaystones();
    } catch {
      return null;
    }
  }, []);

  const { data: friendsData, loading: friendsLoading } = useAsyncData(async () => {
    try {
      return await playerApi.getMyFriends();
    } catch {
      return null;
    }
  }, []);

  const waystonesList = Array.isArray(waystonesData?.waystones) ? waystonesData.waystones : [];
  const friendsList = Array.isArray(friendsData?.friends) ? friendsData.friends : [];
  const pendingFriendsCount = Number(friendsData?.totalPendingRequests ?? 0);

  const waystoneColumns = [
    {
      key: 'name',
      header: lang === 'vi' ? 'ĐIỂM DỊCH CHUYỂN' : 'WAYSTONE',
      render: (row) => {
        const shortId = row.waystoneId ? String(row.waystoneId).slice(0, 8).toUpperCase() : 'UNKNOWN';
        const displayName =
        row.customName && row.customName.trim() !== ''
            ? row.customName
            : `WAYSTONE #${shortId}`;
        const worldText = row.coordinates?.world
          ? formatWorldName(row.coordinates.world)
          : lang === 'vi'
          ? 'CHƯA ĐẶT'
          : 'UNPLACED';

        return (
          <div className="font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-ink-primary">{displayName}</span>
              <span className="text-[10px] font-bold text-ink-secondary">LV.{row.level ?? 1}</span>
            </div>
            <div className="text-[11px] text-ink-secondary">
              {worldText}
              {row.ownerName ? ` // ${lang === 'vi' ? 'Chủ' : 'Owner'}: ${row.ownerName}` : ''}
            </div>
          </div>
        );
      },
    },
    {
      key: 'coords',
      header: lang === 'vi' ? 'TỌA ĐỘ (X / Y / Z)' : 'COORDINATES (X / Y / Z)',
      align: 'right',
      render: (row) => {
        const c = row.coordinates;
        if (!row.isPlaced || !c) {
          return (
            <span className="font-mono text-xs text-ink-secondary">
              {lang === 'vi' ? 'TRONG TÚI' : 'IN INVENTORY'}
            </span>
          );
        }
        return (
          <div className="font-mono text-xs tabular-nums">
            <div className="font-semibold text-accent-emerald">
              {Math.round(c.x)} / {Math.round(c.y)} / {Math.round(c.z)}
            </div>
            {row.visitFee?.raw > 0 && (
              <div className="text-[10px] text-ink-secondary">
                {lang === 'vi' ? 'Phí: ' : 'Fee: '}
                <CurrencyDisplay currency={row.visitFee} compact />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: lang === 'vi' ? 'TRẠNG THÁI' : 'STATUS',
      align: 'right',
      render: (row) => {
        if (!row.isPlaced) {
          return <StatusTag label={lang === 'vi' ? 'CHƯA ĐẶT' : 'UNPLACED'} variant="neutral" />;
        }
        if (row.taxStatus?.isExpired) {
          return <StatusTag label={lang === 'vi' ? 'HẾT THUẾ' : 'EXPIRED'} variant="crimson" />;
        }
        return (
          <StatusTag
            label={row.isOperational ? 'ACTIVE' : 'OFFLINE'}
            variant={row.isOperational ? 'emerald' : 'amber'}
          />
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

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border border-border-strong bg-surface px-4 py-2.5 font-mono text-xs">
          <span className="font-bold uppercase text-ink-primary">
            [WAYSTONES // {lang === 'vi' ? 'ĐIỂM DỊCH CHUYỂN SỞ HỮU' : 'OWNED WAYSTONES'}]
          </span>
          {waystonesData && (
            <span className="text-[11px] text-ink-secondary tabular-nums">
              {lang === 'vi' ? 'ĐÃ ĐẶT' : 'PLACED'}:{' '}
              <strong>{waystonesData.placedCount ?? 0}</strong> / {waystonesData.total ?? 0}
            </span>
          )}
        </div>
        <DataTable
          columns={waystoneColumns}
          rows={waystonesList}
          rowKey={(row, idx) => row.id || row.waystoneId || idx}
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
  );
}