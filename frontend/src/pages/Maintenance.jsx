import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import LogModal from '../components/maintenance/LogModal';
import CostSummary from '../components/maintenance/CostSummary';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_ICONS = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };

function currentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function fmtDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function TaskCard({ task, lang, logsThisYear, expanded, onExpand, onLog, onEditLog, onToggle, onDelete, t }) {
  const name = lang === 'no' ? task.name_no : task.name_en;
  const doneThisYear = logsThisYear.length > 0;

  return (
    <div className={`bg-white rounded-xl border transition-all ${task.is_active ? 'border-slate-100 shadow-sm' : 'border-slate-100 opacity-60'}`}>
      <div className="flex items-center gap-3 p-3.5">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${doneThisYear ? 'bg-green-400' : task.is_active ? 'bg-slate-200' : 'bg-slate-100'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${task.is_active ? 'text-slate-800' : 'text-slate-400'}`}>{name}</p>
          {task.last_completed ? (
            <p className="text-xs text-slate-400 mt-0.5">{t('maintenance.lastCompleted')}: {fmtDate(task.last_completed)}</p>
          ) : (
            <p className="text-xs text-slate-300 mt-0.5">{t('maintenance.never')}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {task.is_active && (
            <button
              onClick={() => onLog(task)}
              className="bg-ocean-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-ocean-700 transition-colors"
            >
              + {t('maintenance.doneThisYear')}
            </button>
          )}
          {logsThisYear.length > 0 && (
            <button
              onClick={onExpand}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs"
            >
              {expanded ? '▲' : `▼ ${logsThisYear.length}`}
            </button>
          )}
          <TaskMenu task={task} onToggle={onToggle} onDelete={onDelete} t={t} />
        </div>
      </div>

      {expanded && logsThisYear.length > 0 && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {logsThisYear.map(log => (
            <div key={log.id} className="px-4 py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-700 font-medium">{fmtDate(log.completed_date)}</span>
                  {log.cost_nok && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {Number(log.cost_nok).toLocaleString()} kr
                    </span>
                  )}
                  {log.photos?.length > 0 && (
                    <span className="text-xs text-slate-400">📷 {log.photos.length}</span>
                  )}
                </div>
                {log.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{log.notes}</p>}
              </div>
              <button
                onClick={() => onEditLog(log)}
                className="text-xs text-ocean-600 hover:text-ocean-700 shrink-0 mt-0.5"
              >
                {t('maintenance.log.editTitle')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskMenu({ task, onToggle, onDelete, t }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[130px]">
            <button
              onClick={() => { onToggle(); setOpen(false); }}
              className="w-full text-left text-sm px-4 py-2 hover:bg-slate-50 text-slate-700"
            >
              {task.is_active ? t('maintenance.task.disable') : t('maintenance.task.enable')}
            </button>
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full text-left text-sm px-4 py-2 hover:bg-red-50 text-red-500"
            >
              {task.is_custom ? t('maintenance.task.remove') : t('maintenance.task.disable')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Maintenance() {
  const { id: boatId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('no') ? 'no' : 'en';

  const [boat, setBoat] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(currentSeason);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [logModal, setLogModal] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const fetchAll = async () => {
    try {
      const [boatRes, tasksRes, logsRes, summaryRes] = await Promise.all([
        api.get(`/boats/${boatId}`),
        api.get(`/boats/${boatId}/maintenance/tasks`),
        api.get(`/boats/${boatId}/maintenance/logs?year=${selectedYear}`),
        api.get(`/boats/${boatId}/maintenance/summary`),
      ]);
      setBoat(boatRes.data);
      setTasks(tasksRes.data);
      setLogs(logsRes.data);
      setSummary(summaryRes.data);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [boatId, selectedYear]);

  const refreshTasksAndSummary = async () => {
    const [tasksRes, summaryRes] = await Promise.all([
      api.get(`/boats/${boatId}/maintenance/tasks`),
      api.get(`/boats/${boatId}/maintenance/summary`),
    ]);
    setTasks(tasksRes.data);
    setSummary(summaryRes.data);
  };

  const handleToggleTask = async (task) => {
    await api.patch(`/boats/${boatId}/maintenance/tasks/${task.id}`, { is_active: !task.is_active });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_active: !t.is_active } : t));
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(lang === 'no' ? 'Fjerne denne oppgaven?' : 'Remove this task?')) return;
    await api.delete(`/boats/${boatId}/maintenance/tasks/${task.id}`);
    if (task.is_custom) {
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_active: false } : t));
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const res = await api.post(`/boats/${boatId}/maintenance/tasks`, { name: newTaskName.trim(), season });
    setTasks(prev => [...prev, res.data]);
    setNewTaskName('');
    setAddingTask(false);
  };

  const handleLogSaved = (log, isEdit) => {
    if (isEdit) {
      setLogs(prev => prev.map(l => l.id === log.id ? { ...l, ...log } : l));
    } else {
      setLogs(prev => [log, ...prev]);
    }
    refreshTasksAndSummary();
    setLogModal(null);
  };

  const handleLogDeleted = (logId) => {
    setLogs(prev => prev.filter(l => l.id !== logId));
    refreshTasksAndSummary();
    setLogModal(null);
  };

  const seasonTasks = tasks.filter(t => t.season === season);
  const activeTasks = seasonTasks.filter(t => t.is_active);
  const inactiveTasks = seasonTasks.filter(t => !t.is_active);

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to={`/boats/${boatId}`} className="text-sm text-ocean-600 hover:underline">
            ← {boat?.name}
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            🔧 {t('maintenance.title')}
          </h1>
        </div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-500 mt-1"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Season tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
        {SEASONS.map(s => (
          <button
            key={s}
            onClick={() => { setSeason(s); setExpandedTaskId(null); setAddingTask(false); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${
              season === s
                ? 'text-ocean-700 border-b-2 border-ocean-600 bg-ocean-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-lg">{SEASON_ICONS[s]}</span>
            <span className="text-xs hidden sm:block">{t(`maintenance.season.${s}`)}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {activeTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            lang={lang}
            logsThisYear={logs.filter(l => l.task_id === task.id)}
            expanded={expandedTaskId === task.id}
            onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
            onLog={() => setLogModal({ task })}
            onEditLog={log => setLogModal({ task, log })}
            onToggle={() => handleToggleTask(task)}
            onDelete={() => handleDeleteTask(task)}
            t={t}
          />
        ))}

        {activeTasks.length === 0 && inactiveTasks.length === 0 && (
          <p className="text-center text-slate-400 py-6 text-sm">
            {lang === 'no' ? 'Ingen oppgaver denne sesongen' : 'No tasks for this season'}
          </p>
        )}

        {inactiveTasks.length > 0 && (
          <details className="group mt-1">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-500 py-1.5 select-none list-none flex items-center gap-1">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              {inactiveTasks.length} {lang === 'no' ? 'deaktiverte oppgaver' : 'disabled tasks'}
            </summary>
            <div className="space-y-2 mt-2">
              {inactiveTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  lang={lang}
                  logsThisYear={logs.filter(l => l.task_id === task.id)}
                  expanded={expandedTaskId === task.id}
                  onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  onLog={() => setLogModal({ task })}
                  onEditLog={log => setLogModal({ task, log })}
                  onToggle={() => handleToggleTask(task)}
                  onDelete={() => handleDeleteTask(task)}
                  t={t}
                />
              ))}
            </div>
          </details>
        )}

        {/* Add custom task */}
        {addingTask ? (
          <form onSubmit={handleAddTask} className="flex gap-2 mt-2">
            <input
              autoFocus
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
              placeholder={t('maintenance.task.addPlaceholder')}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
            <button
              type="submit"
              className="bg-ocean-600 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-ocean-700 font-medium"
            >
              {t('maintenance.task.add')}
            </button>
            <button
              type="button"
              onClick={() => { setAddingTask(false); setNewTaskName(''); }}
              className="text-slate-500 text-sm px-3 py-2.5 rounded-xl hover:bg-slate-100"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="w-full text-sm text-ocean-600 hover:text-ocean-800 py-2.5 border border-dashed border-ocean-300 rounded-xl hover:border-ocean-500 hover:bg-ocean-50 transition-colors mt-1"
          >
            + {t('maintenance.addTask')}
          </button>
        )}
      </div>

      {/* Cost summary */}
      <div className="pt-2">
        <button
          onClick={() => setShowSummary(v => !v)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          <span>{showSummary ? '▼' : '▶'}</span>
          {t('maintenance.summary.title')}
        </button>
        {showSummary && <CostSummary summary={summary} t={t} lang={lang} selectedYear={selectedYear} />}
      </div>

      {/* Log modal */}
      {logModal && (
        <LogModal
          boatId={boatId}
          task={logModal.task}
          log={logModal.log}
          lang={lang}
          onSave={handleLogSaved}
          onDelete={handleLogDeleted}
          onClose={() => setLogModal(null)}
          t={t}
        />
      )}
    </div>
  );
}
