import { useEffect, useState } from 'react';
import { operatorApi } from '../../../api/services/operator.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import ChestGrid from '../../../components/rpg/ChestGrid';
import CurrencyDisplay from '../../../components/rpg/CurrencyDisplay';
import PlayerBadge from '../../../components/rpg/PlayerBadge';
import StatusTag from '../../../components/ui/StatusTag';

const MAIN_INVENTORY_SLOTS = Array.from({ length: 27 }, (_, i) => i + 9);
const HOTBAR_SLOTS = Array.from({ length: 9 }, (_, i) => i);

const COMMAND_PRESETS = [
  { id: 'KICK', label: { vi: 'ĐUỔI KHỎI SERVER (KICK)', en: 'KICK PLAYER' } },
  { id: 'WARN', label: { vi: 'GỬI CẢNH CÁO IN-GAME', en: 'SEND WARNING' } },
  { id: 'FREEZE', label: { vi: 'TẠM KHÓA GIAO DỊCH / ĐÓNG BĂNG', en: 'FREEZE ACCOUNT' } },
  { id: 'GIVE_CURRENCY', label: { vi: 'CỘNG / TRỪ TIỀN (COPPER)', en: 'ADJUST CURRENCY' } },
  { id: 'SYNC_SAVE', label: { vi: 'ÉP ĐỒNG BỘ LƯU DỮ LIỆU', en: 'FORCE SAVE DATA' } },
];

export default function OperatorPlayerInspectTab({ initialUsername = '', lang }) {
  const [searchInput, setSearchInput] = useState(initialUsername);
  const [targetUsername, setTargetUsername] = useState(initialUsername);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [invKeyword, setInvKeyword] = useState('');
  const [invSearchResults, setInvSearchResults] = useState(null);

  // Command Queue state
  const [actionType, setActionType] = useState('WARN');
  const [actionValue, setActionValue] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (initialUsername && initialUsername !== targetUsername) {
      setSearchInput(initialUsername);
      setTargetUsername(initialUsername);
      setSelectedSlot(null);
      setInvSearchResults(null);
    }
  }, [initialUsername, targetUsername]);

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

  const activeSlot = selectedSlot ?? inspectData?.selectedSlot ?? inspectData?.activeSlot ?? 1;

  const { data: invData, loading: invLoading } = useAsyncData(
    async () => {
      try {
        return await operatorApi.inspectPlayerInventory(targetUsername, { slot: activeSlot });
      } catch {
        return null;
      }
    },
    [targetUsername, activeSlot],
    { immediate: Boolean(targetUsername && inspectData) }
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;
    setTargetUsername(clean);
    setSelectedSlot(null);
    setInvSearchResults(null);
    setActionFeedback(null);
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
        slot: activeSlot,
      });
      setInvSearchResults(res);
    } catch {
      setInvSearchResults({ totalMatches: 0, results: [] });
    }
  };

  const handleDispatchAction = async () => {
    if (!targetUsername || !actionReason.trim()) return;
    setActionSubmitting(true);
    setActionFeedback(null);
    try {
      const payload = {
        action: actionType,
        reason: actionReason.trim(),
      };
      if (actionValue.trim() !== '') {
        payload.value = actionValue.trim();
      }
      await operatorApi.dispatchPlayerAction(targetUsername, payload);
      setActionFeedback({
        ok: true,
        text:
          lang === 'vi'
            ? `Đã đẩy lệnh [${actionType}] vào hàng đợi thực thi cho ${targetUsername}.`
            : `Queued [${actionType}] command for ${targetUsername}.`,
      });
      setConfirmingAction(false);
      setActionValue('');
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

  const vanillaInventory = Array.isArray(invData?.vanillaInventory)
    ? invData.vanillaInventory
    : [];
  const enderChest = Array.isArray(invData?.enderChest) ? invData.enderChest : [];
  const backpacks = Array.isArray(invData?.backpacks) ? invData.backpacks : [];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap items-center gap-2 border border-border-strong bg-surface p-4 font-mono text-xs"
      >
        <span className="font-bold uppercase text-ink-primary">
          [INSPECT 360° // {lang === 'vi' ? 'NHẬP TÊN NHÂN VẬT' : 'TARGET USERNAME'}]:
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
          [{lang === 'vi' ? 'SOI HỒ SƠ' : 'INSPECT TARGET'}]
        </button>
      </form>

      {!targetUsername && (
        <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
          [
          {lang === 'vi'
            ? 'NHẬP TÊN NGƯỜI CHƠI HOẶC BẤM [SOI 360] TỪ BẢNG GIAO DỊCH ĐỂ BẮT ĐẦU'
            : 'ENTER A PLAYER USERNAME OR CLICK [SOI 360] FROM TRANSACTIONS'}
          ]
        </div>
      )}

      {targetUsername && inspectLoading && (
        <div className="border border-border-strong bg-surface p-8 text-center font-mono text-xs text-ink-secondary">
          [{lang === 'vi' ? 'ĐANG TRÍCH XUẤT HỒ SƠ 360°...' : 'LOADING 360 DOSSIER...'}]
        </div>
      )}

      {targetUsername && inspectError && (
        <div className="border border-accent-crimson bg-surface p-4 font-mono text-xs font-bold text-accent-crimson">
          [ERROR // {inspectError?.message || 'PLAYER_NOT_FOUND'}]
        </div>
      )}

      {targetUsername && inspectData && !inspectLoading && (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Cột trái: Thông tin 360° & Hàng đợi lệnh */}
          <div className="space-y-4 lg:col-span-5">
            <div className="space-y-3 border border-border-strong bg-surface p-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="font-bold uppercase text-ink-primary">[TARGET DOSSIER]</span>
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
                  username: inspectData.username || targetUsername,
                  uuid: inspectData.uuid,
                  isVip: inspectData.isVip,
                  adventurerRank:
                    typeof inspectData.adventurerRank === 'object'
                      ? inspectData.adventurerRank?.rank
                      : inspectData.adventurerRank,
                  guildTag: inspectData.guild?.tag,
                  role: inspectData.role,
                }}
                showUuid
              />

              <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-2 tabular-nums">
                <div className="border border-border-subtle bg-canvas p-2">
                  <div className="text-[10px] text-ink-secondary">CLASS // LEVEL</div>
                  <div className="font-bold text-ink-primary">
                    {String(inspectData.class || 'COMMONER').toUpperCase()} LV.
                    {inspectData.level ?? 1}
                  </div>
                </div>
                <div className="border border-border-subtle bg-canvas p-2">
                  <div className="text-[10px] text-ink-secondary">SLOT BALANCE</div>
                  <div className="mt-0.5">
                    <CurrencyDisplay currency={inspectData.currency || 0} compact />
                  </div>
                </div>
              </div>

              {Array.isArray(inspectData.slotsSummary) && inspectData.slotsSummary.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {inspectData.slotsSummary
                    .filter((s) => s.isCreated || s.slot === activeSlot)
                    .map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        onClick={() => setSelectedSlot(Number(s.slot))}
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

            {/* Command Queue Box */}
            <div className="space-y-3 border-2 border-border-strong bg-surface p-4 font-mono text-xs">
              <div className="border-b border-border-subtle pb-2 font-bold uppercase text-accent-crimson">
                [COMMAND QUEUE // {lang === 'vi' ? 'GỬI LỆNH SERVER GAME' : 'LIVE SERVER ACTION'}]
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
                  {lang === 'vi' ? 'LOẠI HÀNH ĐỘNG' : 'ACTION TYPE'}
                </label>
                <select
                  value={actionType}
                  onChange={(e) => {
                    setActionType(e.target.value);
                    setConfirmingAction(false);
                  }}
                  className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs font-bold text-ink-primary"
                >
                  {COMMAND_PRESETS.map((cmd) => (
                    <option key={cmd.id} value={cmd.id}>
                      [{cmd.id}] — {cmd.label[lang]}
                    </option>
                  ))}
                </select>
              </div>

              {(actionType === 'GIVE_CURRENCY' || actionType === 'WARN') && (
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-ink-secondary">
                    {actionType === 'GIVE_CURRENCY'
                      ? lang === 'vi'
                        ? 'SỐ TIỀN (COPPER — CÓ THỂ ÂM)'
                        : 'AMOUNT (COPPER)'
                      : lang === 'vi'
                      ? 'NỘI DUNG TIN NHẮN'
                      : 'MESSAGE PAYLOAD'}
                  </label>
                  <input
                    type="text"
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    placeholder={actionType === 'GIVE_CURRENCY' ? 'vd: -4096' : 'Nội dung cảnh cáo'}
                    className="w-full border border-border-strong bg-canvas px-2.5 py-1.5 text-xs text-ink-primary"
                  />
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

          {/* Cột phải: Soi túi đồ & Tìm vật phẩm trong túi */}
          <div className="space-y-4 border border-border-strong bg-surface p-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2 font-mono text-xs">
              <span className="font-bold uppercase text-ink-primary">
                [REMOTE INVENTORY // SLOT #{activeSlot}]
              </span>
              <form onSubmit={handleSearchInventory} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={invKeyword}
                  onChange={(e) => setInvKeyword(e.target.value)}
                  placeholder={lang === 'vi' ? 'Tìm trong túi...' : 'Search bag...'}
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
                    [MATCHES: {invSearchResults.totalMatches ?? 0} FOR &quot;{invSearchResults.keyword}&quot;]
                  </span>
                  <button
                    type="button"
                    onClick={() => setInvSearchResults(null)}
                    className="text-ink-secondary hover:text-ink-primary"
                  >
                    [X]
                  </button>
                </div>
                {(invSearchResults.results || []).map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-t border-border-subtle pt-1 text-[11px]"
                  >
                    <span className="font-bold text-ink-primary">
                      {m.item?.displayName || m.item?.type} x{m.item?.amount ?? 1}
                    </span>
                    <StatusTag label={m.locationLabel || m.containerType} variant="emerald" />
                  </div>
                ))}
              </div>
            )}

            {invLoading ? (
              <div className="p-6 text-center font-mono text-xs text-ink-secondary">
                [{lang === 'vi' ? 'ĐANG GIẢI MÃ BASE64 INVENTORY...' : 'DECODING INVENTORY...'}]
              </div>
            ) : (
              <div className="space-y-3 overflow-x-auto">
                <ChestGrid
                  title={lang === 'vi' ? 'TÚI ĐỒ CHÍNH (27 Ô)' : 'MAIN INVENTORY (27 SLOTS)'}
                  items={vanillaInventory}
                  slotIndices={MAIN_INVENTORY_SLOTS}
                  mode="slot"
                />
                <ChestGrid
                  title={lang === 'vi' ? 'THANH PHÍM TẮT (9 Ô)' : 'HOTBAR (9 SLOTS)'}
                  items={vanillaInventory}
                  slotIndices={HOTBAR_SLOTS}
                  mode="slot"
                />
                {enderChest.length > 0 && (
                  <ChestGrid
                    title="ENDER CHEST (27 SLOTS)"
                    items={enderChest}
                    totalSlots={27}
                    mode="slot"
                  />
                )}
                {backpacks.length > 0 && (
                  <div className="border-t border-border-subtle pt-2 font-mono text-xs text-ink-secondary">
                    [BACKPACKS DETECTED: {backpacks.length} —{' '}
                    {backpacks.map((b) => `${b.bagName} (${b.items?.length || 0} items)`).join(', ')}
                    ]
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}