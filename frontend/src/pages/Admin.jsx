import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

function fmt(ts) {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, emoji }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <span className="text-3xl">{emoji}</span>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [boats, setBoats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('users');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/boats'),
    ])
      .then(([s, u, b]) => {
        setStats(s.data);
        setUsers(u.data);
        setBoats(b.data);
      })
      .catch(err => {
        if (err.response?.status === 403) navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">🛠️ Admin</h1>
        <p className="text-sm text-slate-400 mt-0.5">Everything. All of it.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard emoji="👤" label="Users"            value={stats?.users} />
        <StatCard emoji="⛵" label="Boats"            value={stats?.boats} />
        <StatCard emoji="📚" label="Wiki items"       value={stats?.wiki} />
        <StatCard emoji="🔧" label="Maintenance logs" value={stats?.logs} />
        <StatCard emoji="🧭" label="Chat messages"    value={stats?.messages} />
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 border-b border-slate-100">
        {['users', 'boats'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-ocean-600 text-ocean-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'users' ? `👤 Users (${users.length})` : `⛵ Boats (${boats.length})`}
          </button>
        ))}
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-center px-4 py-3">Lang</th>
                  <th className="text-center px-4 py-3">Boats</th>
                  <th className="text-center px-4 py-3">Messages</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full shrink-0" />
                          : <div className="w-7 h-7 rounded-full bg-ocean-100 flex items-center justify-center text-xs text-ocean-600 shrink-0">{u.name?.[0]}</div>
                        }
                        <span className="font-medium text-slate-800 truncate max-w-[160px]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{u.language}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">{u.boat_count}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">{u.message_count}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmt(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Boats table */}
      {tab === 'boats' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Boat</th>
                  <th className="text-left px-4 py-3">Owner</th>
                  <th className="text-center px-4 py-3">Public</th>
                  <th className="text-center px-4 py-3">Tasks</th>
                  <th className="text-center px-4 py-3">Logs</th>
                  <th className="text-center px-4 py-3">Wiki</th>
                  <th className="text-center px-4 py-3">Msgs</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {boats.map(b => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{b.name}</p>
                        {(b.type || b.year) && (
                          <p className="text-xs text-slate-400 mt-0.5">{[b.year, b.type].filter(Boolean).join(' · ')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{b.owner_name}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{b.owner_email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.is_public
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Yes</span>
                        : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">No</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{b.task_count}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{b.log_count}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{b.wiki_count}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{b.message_count}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmt(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
