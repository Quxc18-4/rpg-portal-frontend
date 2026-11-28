import { playerApi } from '../../../api/services/player.api';
import { useAsyncData } from '../../../hooks/useAsyncData';
import DataTable from '../../../components/ui/DataTable';
import StatusTag from '../../../components/ui/StatusTag';

function getRequiredJobExp(level) {
  const safeLevel = Math.max(1, Number(level || 1));
  return Math.pow(safeLevel, 2) * 50 + 500;
}

function formatExpNumber(value) {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function PlayerProgressionTab({ lang }) {
  const { data: jobsData, loading: jobsLoading } = useAsyncData(async () => {
    try {
      return await playerApi.getMyJobs();
    } catch {
      return null;
    }
  }, []);

  const { data: questsData, loading: questsLoading } = useAsyncData(async () => {
    try {
      return await playerApi.getMyQuests();
    } catch {
      return null;
    }
  }, []);

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

  return (
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
  );
}