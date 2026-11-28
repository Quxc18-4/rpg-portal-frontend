import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { operatorApi } from '../../api/services/operator.api';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/date.util';
import ChestGrid from '../../components/rpg/ChestGrid';
import CurrencyDisplay from '../../components/rpg/CurrencyDisplay';
import ItemSlotCell from '../../components/rpg/ItemSlotCell';
import PlayerBadge from '../../components/rpg/PlayerBadge';
import DataTable from '../../components/ui/DataTable';
import StatusTag from '../../components/ui/StatusTag';

const MAIN_INVENTORY_SLOTS = Array.from({ length: 27 }, (_, i) => i + 9);
const HOTBAR_SLOTS = Array.from({ length: 9 }, (_, i) => i);

const COMMAND_PRESETS = [
  {
    id: 'WARN_PLAYER',
    adminOnly: false,
    paramKey: 'message',
    paramType: 'text',
    placeholder: { vi: 'Nội dung cảnh cáo gửi vào chat...', en: 'Warning message...' },
    label: { vi: 'GỬI CẢNH CÁO IN-GAME', en: 'SEND WARNING' },
  },
  {
    id: 'MUTE_PLAYER',
    adminOnly: false,
    paramKey: 'minutes',
    paramType: 'number',
    placeholder: { vi: 'Số phút cấm chat (vd: 60)', en: 'Minutes (e.g. 60)' },
    label: { vi: 'CẤM CHAT TẠM THỜI (MUTE)', en: 'MUTE PLAYER' },
  },
  {
    id: 'UNMUTE_PLAYER',
    adminOnly: false,
    paramKey: null,
    label: { vi: 'GỠ CẤM CHAT (UNMUTE)', en: 'UNMUTE PLAYER' },
  },
  {
    id: 'KICK_PLAYER',
    adminOnly: false,
    paramKey: 'message',
    paramType: 'text',
    placeholder: { vi: 'Lý do đuổi khỏi server...', en: 'Kick message...' },
    label: { vi: 'ĐUỔI KHỎI SERVER (KICK)', en: 'KICK PLAYER' },
  },
  {
    id: 'FREEZE_PLAYER',
    adminOnly: false,
    paramKey: 'frozen',
    paramType: 'boolean',
    label: { vi: 'ĐÓNG BĂNG / MỞ ĐÓNG BĂNG', en: 'TOGGLE FREEZE' },
  },
  {
    id: 'EXTEND_WAYSTONE_TAX',
    adminOnly: false,
    paramKey: 'days',
    paramType: 'number',
    placeholder: { vi: 'Số ngày gia hạn thuế (vd: 3)', en: 'Days to extend (e.g. 3)' },
    label: { vi: 'GIA HẠN THUẾ WAYSTONE', en: 'EXTEND WAYSTONE TAX' },
  },
  {
    id: 'SEND_COMPENSATION',
    adminOnly: false,
    paramKey: 'coins',
    paramType: 'number',
    placeholder: { vi: 'Số Copper bồi thường (vd: 1024)', en: 'Coins in copper' },
    label: { vi: 'GỬI TIỀN BỒI THƯỜNG', en: 'SEND COMPENSATION' },
  },
  {
    id: 'FORCE_SAVE',
    adminOnly: false,
    paramKey: null,
    label: { vi: 'ÉP LƯU DỮ LIỆU NGAY', en: 'FORCE SAVE DATA' },
  },
  {
    id: 'ADJUST_COINS',
    adminOnly: true,
    paramKey: 'coins',
    paramType: 'number',
    placeholder: { vi: 'Số Copper (+ cộng / - trừ, vd: -4096)', en: 'Copper delta (e.g. -4096)' },
    label: { vi: 'CỘNG / TRỪ TIỀN TỆ [ADMIN]', en: 'ADJUST COINS [ADMIN]' },
  },
  {
    id: 'GIVE_ITEM',
    adminOnly: true,
    paramKey: 'itemSpec',
    paramType: 'text',
    placeholder: { vi: 'item_id:số_lượng (vd: upgrade_stone:10)', en: 'item_id:amount' },
    label: { vi: 'PHÁT VẬT PHẨM RPG [ADMIN]', en: 'GIVE RPG ITEM [ADMIN]' },
  },
  {
    id: 'BAN_PLAYER',
    adminOnly: true,
    paramKey: 'minutes',
    paramType: 'number',
    placeholder: { vi: 'Số phút khóa (0 = vĩnh viễn)', en: 'Ban minutes (0 = permanent)' },
    label: { vi: 'KHÓA TÀI KHOẢN (BAN) [ADMIN]', en: 'BAN PLAYER [ADMIN]' },
  },
  {
    id: 'UNBAN_PLAYER',
    adminOnly: true,
    paramKey: null,
    label: { vi: 'MỞ KHÓA TÀI KHOẢN [ADMIN]', en: 'UNBAN PLAYER [ADMIN]' },
  },
];

function PlayerInspectWorkspace({ initialUsername, onSelectNewTarget, lang }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [searchInput, setSearchInput] = useState(initialUsername);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [detailTab, setDetailTab] = useState('INVENTORY');
  const [inspectedItem, setInspectedItem] = useState(null);

  // Inventory scan
  const [invKeyword, setInvKeyword] = useState('');
  const [invSearchResults, setInvSearchResults] = useState(null);

  // Command queue
  const [actionType, setActionType] = useState('WARN_PLAYER');
  const [actionParam, setActionParam] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const targetUsername = initialUsername;
  const availableCommands = COMMAND_PRESETS.filter((c) => !c.adminOnly || isAdmin);
  const currentCmdDef =
    availableCommands.find((c) => c.id === actionType) || availableCommands[0];

  const {
    data: inspectData,
    loading: inspectLoading,
    error: inspectError,
    reload: reloadInspect,
  } = useAsyncData(
    () =>
      operatorApi.inspectPlayer(
        targetUsername,
        selectedSlot ? { slot: selectedSlot } : {}
      ),
    [targetUsername, selectedSlot],
    { immediate: Boolean(targetUsername) }
  );

  // Backend inspectPlayerOverview trả về { profile, inventory, jobs, mounts, crops, waystones }
  const profile = inspectData?.profile || {};
  const inventoryObj = inspectData?.inventory || {};
  const activeSlot = selectedSlot ?? profile.selectedSlot ?? profile.activeSlot ?? 1;

  const { data: marketData, loading: marketLoading } = useAsyncData(
    async () => {
      const [auctions, trades] = await Promise.all([
        operatorApi.inspectPlayerAuctions(targetUsername, { page: 1, limit: 15 }).catch(() => null),
        operatorApi.inspectPlayerTrades(targetUsername, { page: 1, limit: 15 }).catch(() => null),
      ]);
      return { auctions, trades };
    },
    [targetUsername],
    { immediate: Boolean(targetUsername && inspectData && detailTab === 'HISTORY') }
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;
    onSelectNewTarget(clean);
  };

  const handleSearchInventory = async (e) => {
    e.preventDefault();
    if (!targetUsername || !invKeyword.trim()) {
      setInvSearchResults(null);
      return;
    }
    try {
      const res = await operatorApi.searchPlayerInventory(targetUsername, {
        q: invKeyword.trim(),
      });
      setInvSearchResults(res);
    } catch {
      setInvSearchResults({ totalMatched: 0, items: [] });
    }
  };

  const buildCommandPayload = () => {
    if (!currentCmdDef?.paramKey) return {};
    if (currentCmdDef.paramType === 'number') {
      return { [currentCmdDef.paramKey]: Number(actionParam || 0) };
    }
    if (currentCmdDef.paramType === 'boolean') {
      return { frozen: actionParam !== 'false' };
    }
    if (currentCmdDef.paramKey === 'itemSpec') {
      const [itemId, amtStr] = String(actionParam).split(':');
      return {
        itemId: (itemId || '').trim(),
        amount: Math.max(1, Number(amtStr) || 1),
      };
    }
    return { [currentCmdDef.paramKey]: String(actionParam || '').trim() };
  };

  const handleDispatchAction = async () => {
    if (!targetUsername || !actionReason.trim()) return;
    setActionSubmitting(true);
    setActionFeedback(null);
    try {
      await operatorApi.dispatchPlayerAction(targetUsername, {
        action: actionType,
        payload: buildCommandPayload(),
        reason: actionReason.trim(),
      });
      setActionFeedback({
        ok: true,
        text:
          lang === 'vi'
            ? `Đã đẩy lệnh [${actionType}] vào hàng đợi thực thi cho ${targetUsername}.`
            : `Queued [${actionType}] command for ${targetUsername}.`,
      });
      setConfirmingAction(false);
      setActionParam('');
      setActionReason('');
    } catch (err) {
      setActionFeedback({
        ok: false,
        text: err?.message || 'ACTION_DISPATCH_FAILED',
      });
      setConfirmingAction(false);
    } finally {
      setActionSubmitting(false);
    }
  };

  const vanillaInventory = Array.isArray(inventoryObj.vanillaInventory)
    ? inventoryObj.vanillaInventory
    : [];
  const enderChest = Array.isArray(inventoryObj.enderChest) ? inventoryObj.enderChest : [];
  const backpacks = Array.isArray(inventoryObj.backpacks) ? inventoryObj.backpacks : [];

  const tradesList = Array.isArray(marketData?.trades?.items) ? marketData.trades.items : [];

  const tradeColumns = [
    {
      key: 'partner',
      header: lang === 'vi' ? 'ĐỐI TÁC GIAO DỊCH' : 'TRADE PARTNER',
      render: (row) => (
        <div className="font-mono text-xs">
          <div className="font-bold text-ink-primary">
            {row.perspective?.partner?.username || row.side2?.player?.username || 'Unknown'}
          </div>
          <div className="text-[10px] text-ink-secondary">
            {formatDateTime(row.tradedAt || row.createdAt, lang)}
          </div>
        </div>
      ),
    },
    {
      key: 'offered',
      header: lang === 'vi' ? 'ĐÃ ĐƯA RA' : 'OFFERED',
      render: (row) => (
        <div className="font-mono text-xs">
          <CurrencyDisplay currency={row.perspective?.offered?.currency || 0} compact />
          <div className="text-[10px] text-ink-secondary">
            {row.perspective?.offered?.items?.length || 0} items
          </div>
        </div>
      ),
    },
    {
      key: 'received',
      header: lang === 'vi' ? 'NHẬN LẠI' : 'RECEIVED',
      align: 'right',
      render: (row) => (
        <div className="font-mono text-xs">
          <CurrencyDisplay currency={row.perspective?.received?.currency || 0} compact />
          <div className="text-[10px] text-ink-secondary">
            {row.perspective?.received?.items?.length || 0} items
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-border-strong bg-surface p-4">
        <div>
          <div className="font-mono text-xs font-bold uppercase text-accent-crimson">
            [PLAYER INSPECT 360° // DEEP AUDIT &amp; COMMAND QUEUE]
          </div>
          <div className="mt-1 font-mono text-xs text-ink-secondary">
            {lang === 'vi'
              ? 'Soi toàn bộ túi đồ, kho phụ, tài sản thế giới, giao dịch và gửi lệnh thực thi trực tiếp.'
              : 'Inspect inventories, world assets, trade logs and queue live server commands.'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <Link
            to="/operator"
            className="border border-border-strong bg-canvas px-3 py-1.5 font-bold text-ink-primary hover:bg-subheader"
          >
            [{'< OVERVIEW'}]
          </Link>
          <Link
            to="/operator/economy"
            className="border border-border-strong bg-canvas px-3 py-1.5 font-bold text-ink-primary hover:bg-subheader"
          >
            [{'ECONOMY AUDIT >'}]
          </Link>
        </div>
      </div>

      {/* Target Search Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap items-center gap-2 border border-border-strong bg-surface p-4 font-mono text-xs"
      >
        <span className="font-bold uppercase text-ink-primary">
          [{lang === 'vi' ? 'NHẬP TÊN NHÂN VẬT' : 'TARGET USERNAME'}]:
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="vd: Kuuhaku"
          className="min-w-[220px] flex-1 border border-border-strong bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-primary"
        />
        <button
          type="submit"
          className="border border-border-strong bg-ink-primary px-4 py-1.5 font-bold text-white hover:bg-accent-emerald"
        >
          [{lang === 'vi' ? 'TRÍCH XUẤT HỒ SƠ' : 'LOAD DOSSIER'}]
        </button>
      </form>

      {!targetUsername && (
        <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
          [{lang === 'vi' ? 'NHẬP TÊN NGƯỜI CHƠI ĐỂ BẮT ĐẦU SOI 360°' : 'ENTER A USERNAME TO INSPECT'}]
        </div>
      )}

      {targetUsername && inspectLoading && (
        <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
          [{lang === 'vi' ? 'ĐANG TẢI DỮ LIỆU 360°...' : 'LOADING 360° DOSSIER...'}]
        </div>
      )}

      {targetUsername && inspectError && (
        <div className="border border-accent-crimson bg-surface p-4 font-mono text-xs font-bold text-accent-crimson">
          [ERROR // {inspectError?.message || 'PLAYER_NOT_FOUND'}]
        </div>
      )}

      {targetUsername && inspectData && !inspectLoading && (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Cột trái: Dossier & Command Queue */}
          <div className="space-y-4 lg:col-span-5">
            <div className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="font-bold uppercase text-ink-primary">[CHARACTER DOSSIER]</span>
                <button
                  type="button"
                  onClick={() => reloadInspect()}
                  className="border border-border-strong bg-canvas px-2 py-0.5 text-[10px] font-bold hover:bg-subheader"
                >
                  [SYNC]
                </button>
              </div>

              <PlayerBadge
                player={{
                  username: profile.username || targetUsername,
                  uuid: profile.uuid,
                  isVip: profile.isVip,
                  adventurerRank:
                    typeof profile.adventurerRank === 'object'
                      ? profile.adventurerRank?.rank
                      : profile.adventurerRank,
                  guildTag: profile.guild?.tag,
                  role: profile.role,
                }}
                showUuid
              />

              <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-2 tabular-nums">
                <div className="border border-border-subtle bg-canvas p-2">
                  <div className="text-[10px] text-ink-secondary">CLASS // LEVEL</div>
                  <div className="font-bold text-ink-primary">
                    {String(profile.class || 'COMMONER').toUpperCase()} LV.{profile.level ?? 1}
                  </div>
                </div>
                <div className="border border-border-subtle bg-canvas p-2">
                  <div className="text-[10px] text-ink-secondary">SLOT BALANCE</div>
                  <div className="mt-0.5">
                    <CurrencyDisplay currency={profile.currency || 0} compact />
                  </div>
                </div>
              </div>

              {Array.isArray(profile.slotsSummary) && profile.slotsSummary.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {profile.slotsSummary
                    .filter((s) => s.isCreated || s.slot === activeSlot)
                    .map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(Number(s.slot));
                          setInvSearchResults(null);
                        }}
                        className={`border border-border-strong px-2 py-0.5 text-[11px] font-bold ${
                          Number(s.slot) === Number(activeSlot)
                            ? 'bg-ink-primary text-white'
                            : 'bg-canvas text-ink-primary hover:bg-subheader'
                        }`}
                      >
                        SLOT #{s.slot} (LV.{s.level ?? 1})
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Command Queue */}
            <div className="space-y-3 border-2 border-border-strong bg-surface p-4 font-mono text-xs">
              <div className="border-b border-border-subtle pb-2 font-bold uppercase text-accent-crimson">
                [COMMAND QUEUE // {lang === 'vi' ? 'HÀNG ĐỢI LỆNH SERVER' : 'SERVER COMMANDS'}]
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
                  {lang === 'vi' ? 'LOẠI HÀNH ĐỘNG' : 'ACTION TYPE'}
                </label>
                <select
                  value={actionType}
                  onChange={(e) => {
                    setActionType(e.target.value);
                    setActionParam('');
                    setConfirmingAction(false);
                  }}
                  className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-bold text-ink-primary"
                >
                  {availableCommands.map((cmd) => (
                    <option key={cmd.id} value={cmd.id}>
                      [{cmd.id}] — {cmd.label[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {currentCmdDef?.paramKey && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
                    {lang === 'vi' ? 'THAM SỐ LỆNH' : 'COMMAND PARAMETER'}
                  </label>
                  {currentCmdDef.paramType === 'boolean' ? (
                    <select
                      value={actionParam || 'true'}
                      onChange={(e) => setActionParam(e.target.value)}
                      className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-bold text-ink-primary"
                    >
                      <option value="true">
                        {lang === 'vi' ? 'BẬT ĐÓNG BĂNG (FREEZE)' : 'FREEZE = TRUE'}
                      </option>
                      <option value="false">
                        {lang === 'vi' ? 'GỠ ĐÓNG BĂNG (UNFREEZE)' : 'FREEZE = FALSE'}
                      </option>
                    </select>
                  ) : (
                    <input
                      type={currentCmdDef.paramType === 'number' ? 'number' : 'text'}
                      value={actionParam}
                      onChange={(e) => setActionParam(e.target.value)}
                      placeholder={currentCmdDef.placeholder?.[lang] || ''}
                      className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
                  {lang === 'vi' ? 'LÝ DO GHI LOG AUDIT (BẮT BUỘC)' : 'AUDIT LOG REASON (REQUIRED)'}
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="vd: RMT nghi vấn giao dịch #..."
                  className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
                />
              </div>

              {actionFeedback && (
                <div
                  className={`border p-2 text-[11px] font-bold ${
                    actionFeedback.ok
                      ? 'border-accent-emerald bg-canvas text-accent-emerald'
                      : 'border-accent-crimson bg-canvas text-accent-crimson'
                  }`}
                >
                  [{actionFeedback.text}]
                </div>
              )}

              {!confirmingAction ? (
                <button
                  type="button"
                  disabled={!actionReason.trim()}
                  onClick={() => setConfirmingAction(true)}
                  className="w-full border border-border-strong bg-ink-primary py-2 font-bold text-white hover:bg-accent-crimson disabled:opacity-40"
                >
                  [{lang === 'vi' ? 'CHUẨN BỊ THỰC THI LỆNH' : 'STAGE COMMAND'}]
                </button>
              ) : (
                <div className="space-y-2 border border-accent-crimson bg-canvas p-2.5">
                  <div className="text-[11px] font-bold text-accent-crimson">
                    {lang === 'vi'
                      ? `XÁC NHẬN ĐẨY LỆNH [${actionType}] CHO ${targetUsername}?`
                      : `CONFIRM DISPATCH [${actionType}] TO ${targetUsername}?`}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actionSubmitting}
                      onClick={handleDispatchAction}
                      className="flex-1 border border-border-strong bg-accent-crimson py-1.5 font-bold text-white"
                    >
                      {actionSubmitting ? '[SENDING...]' : '[CONFIRM EXECUTE]'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingAction(false)}
                      className="border border-border-strong bg-surface px-3 py-1.5 font-bold"
                    >
                      [CANCEL]
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Sub-tabs Inventory / World Assets / Trade History */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-1.5 border border-border-strong bg-subheader p-2 font-mono text-xs">
              {[
                { id: 'INVENTORY', label: lang === 'vi' ? 'TÚI ĐỒ & KHO' : 'INVENTORY' },
                { id: 'WORLD', label: lang === 'vi' ? 'NGHỀ / THÚ / WAYSTONE' : 'WORLD ASSETS' },
                { id: 'HISTORY', label: lang === 'vi' ? 'GIAO DỊCH CÁ NHÂN' : 'TRADE HISTORY' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetailTab(t.id)}
                  className={`border border-border-strong px-3 py-1.5 font-bold ${
                    detailTab === t.id
                      ? 'bg-ink-primary text-white'
                      : 'bg-surface text-ink-primary hover:bg-canvas'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {detailTab === 'INVENTORY' && (
              <div className="space-y-4 border border-border-strong bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2 font-mono text-xs">
                  <span className="font-bold uppercase text-ink-primary">
                    [REMOTE INVENTORY // SLOT #{activeSlot}]
                  </span>
                  <form onSubmit={handleSearchInventory} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={invKeyword}
                      onChange={(e) => setInvKeyword(e.target.value)}
                      placeholder={lang === 'vi' ? 'Tìm trong mọi túi...' : 'Search all bags...'}
                      className="border border-border-strong bg-canvas px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="border border-border-strong bg-ink-primary px-2.5 py-1 font-bold text-white"
                    >
                      [SCAN]
                    </button>
                  </form>
                </div>

                {invSearchResults && (
                  <div className="space-y-1.5 border border-border-strong bg-canvas p-3 font-mono text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>
                        [MATCHED: {invSearchResults.totalMatched ?? 0} SLOTS (x
                        {invSearchResults.totalQuantity ?? 0}) FOR &quot;{invSearchResults.keyword}
                        &quot;]
                      </span>
                      <button
                        type="button"
                        onClick={() => setInvSearchResults(null)}
                        className="text-ink-secondary hover:text-ink-primary"
                      >
                        [X]
                      </button>
                    </div>
                    {(invSearchResults.items || []).map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-t border-border-subtle pt-1 text-[11px]"
                      >
                        <button
                          type="button"
                          onClick={() => setInspectedItem(m)}
                          className="text-left font-bold text-ink-primary hover:text-accent-emerald"
                        >
                          {m.displayName || m.type} x{m.amount ?? 1}
                        </button>
                        <StatusTag
                          label={m.mountName || m.source || `SLOT #${m.slot ?? '?'}`}
                          variant="emerald"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {inspectedItem && (
                  <div className="border-2 border-mc-tooltip-border bg-mc-tooltip-bg p-2.5 font-mono text-xs text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#55FFFF]">
                        {inspectedItem.displayName || inspectedItem.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectedItem(null)}
                        className="text-[#AAAAAA] hover:text-white"
                      >
                        [X]
                      </button>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-[#AAAAAA]">
                      {(inspectedItem.lore || []).map((line, i) => (
                        <div key={i}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 overflow-x-auto">
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
                  {enderChest.length > 0 && (
                    <ChestGrid
                      title="ENDER CHEST (27 SLOTS)"
                      items={enderChest}
                      totalSlots={27}
                      mode="slot"
                      onSelectItem={(it) => setInspectedItem(it)}
                    />
                  )}
                  {backpacks.length > 0 && (
                    <div className="space-y-2 border-t border-border-subtle pt-2 font-mono text-xs">
                      <div className="font-bold text-ink-primary">
                        [BACKPACKS: {backpacks.length}]
                      </div>
                      {backpacks.map((b) => (
                        <div
                          key={b.bagUuid}
                          className="flex items-center justify-between border border-border-subtle bg-canvas px-2.5 py-1.5"
                        >
                          <span>
                            <strong>{b.bagName}</strong> ({b.parentLocation} #{b.locatedAtSlot})
                          </span>
                          <span className="text-ink-secondary">
                            {b.items?.length || 0} items
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {detailTab === 'WORLD' && (
              <div className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs">
                <div className="border border-border-subtle bg-canvas p-3">
                  <div className="font-bold text-ink-primary">
                    [WAYSTONES]: {inspectData.waystones?.total ?? 0}{' '}
                    {lang === 'vi' ? 'điểm sở hữu' : 'owned'}
                  </div>
                  <div className="mt-1 space-y-1 text-[11px] text-ink-secondary">
                    {(inspectData.waystones?.waystones || []).map((ws) => (
                      <div key={ws.id || ws.waystoneId}>
                        • <strong>{ws.customName || ws.waystoneId}</strong> (LV.{ws.level ?? 1})
                        {ws.coordinates
                          ? ` — ${ws.coordinates.world} (${Math.round(ws.coordinates.x)}, ${Math.round(ws.coordinates.y)}, ${Math.round(ws.coordinates.z)})`
                          : ' — UNPLACED'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border-subtle bg-canvas p-3">
                  <div className="font-bold text-ink-primary">
                    [MOUNTS]: {inspectData.mounts?.mounts?.length ?? 0}{' '}
                    {lang === 'vi' ? 'thú cưỡi' : 'mounts'}
                  </div>
                  <div className="mt-1 space-y-1 text-[11px] text-ink-secondary">
                    {(inspectData.mounts?.mounts || []).map((m) => (
                      <div key={m.slot} className="flex items-center gap-2">
                        <ItemSlotCell item={m.saddleStorage?.items?.[0]} size="sm" />
                        <span>
                          SLOT #{m.slot}: <strong>{m.customName || m.type}</strong> (
                          {m.saddleStorage?.items?.length || 0} items in saddlebag)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border-subtle bg-canvas p-3">
                  <div className="font-bold text-ink-primary">
                    [JOBS]:{' '}
                    {Object.entries(inspectData.jobs?.jobs || {})
                      .map(([k, v]) => `${k.toUpperCase()} LV.${v?.level ?? 1}`)
                      .join(' | ') || 'NONE'}
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'HISTORY' && (
              <DataTable
                columns={tradeColumns}
                rows={tradesList}
                rowKey={(row, idx) => row.id || idx}
                loading={marketLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayerInspectPage() {
  const { lang } = useLanguage();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const resolvedUsername = params.username || searchParams.get('username') || '';

  const handleSelectNewTarget = (nextUsername) => {
    setSearchParams({ username: nextUsername });
  };

  return (
    <PlayerInspectWorkspace
      key={resolvedUsername || 'empty'}
      initialUsername={resolvedUsername}
      onSelectNewTarget={handleSelectNewTarget}
      lang={lang}
    />
  );
}