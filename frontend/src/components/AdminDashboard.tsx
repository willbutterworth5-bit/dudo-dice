import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BackIcon from './BackIcon';
import { useAuth } from '../context/AuthContext';

interface Summary {
  total_games: number;
  unique_players: number;
  unique_guests: number;
  registered_user_games: number;
  guest_games: number;
  vs_ai_games: number;
  online_games: number;
  wins: number;
  losses: number;
  abandoned: number;
  avg_rounds: number;
  avg_duration_seconds: number;
  registered_users: number;
}

interface DayRow {
  day: string;
  game_count: number;
  unique_players: number;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-4">
      <p className="text-white/55 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-white/45 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function BarChart({ data, days }: { data: DayRow[]; days: number }) {
  if (!data.length) return <p className="text-white/40 text-sm text-center py-6">No data yet</p>;

  // Fill in missing days with zeros
  const filled: DayRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find(r => r.day.slice(0, 10) === key);
    filled.push(found ?? { day: key, game_count: 0, unique_players: 0 });
  }

  const maxGames = Math.max(...filled.map(r => r.game_count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 h-32 min-w-0" style={{ minWidth: `${days * 16}px` }}>
        {filled.map(row => (
          <div key={row.day} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className="w-full bg-indigo-400/70 rounded-t hover:bg-indigo-300 transition-colors"
              style={{ height: `${Math.max((row.game_count / maxGames) * 112, row.game_count > 0 ? 4 : 0)}px` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {row.day.slice(5)}: {row.game_count} game{row.game_count !== 1 ? 's' : ''}, {row.unique_players} player{row.unique_players !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-white/30 text-xs">
        <span>{filled[0]?.day.slice(5)}</span>
        <span>{filled[filled.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DayRow[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Basic auth guard — must be signed in
  useEffect(() => {
    if (user === null) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !supabase) return;
    setLoading(true);
    setError(null);

    Promise.all([
      supabase.rpc('get_analytics_summary'),
      supabase.rpc('get_games_by_day', { days_back: days }),
    ]).then(([sumRes, dayRes]) => {
      if (sumRes.error) throw new Error(sumRes.error.message);
      if (dayRes.error) throw new Error(dayRes.error.message);
      setSummary(sumRes.data as Summary);
      setDaily((dayRes.data as DayRow[]) ?? []);
    }).catch(e => {
      setError(e.message);
    }).finally(() => setLoading(false));
  }, [user, days]);

  if (!user) return null;

  const fmtDuration = (secs: number) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="min-h-dvh p-4 sm:p-8" style={{ overflowY: 'auto' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="py-1.5 px-3 text-sm font-bold rounded-xl btn-glass text-white"
          >
            <BackIcon /> Back
          </button>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/30 rounded-xl p-4 text-red-200 text-sm">
            Failed to load: {error}
          </div>
        )}

        {summary && !loading && (
          <>
            {/* Players */}
            <section className="mb-6">
              <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Players</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Registered Users" value={summary.registered_users} />
                <StatCard label="Unique Guests" value={summary.unique_guests} sub="by persistent ID" />
                <StatCard label="Unique Total" value={summary.unique_players} sub="registered + guests" />
              </div>
            </section>

            {/* Games */}
            <section className="mb-6">
              <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Games</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Total Games" value={summary.total_games} />
                <StatCard label="vs Computer" value={summary.vs_ai_games} />
                <StatCard label="Online" value={summary.online_games} />
                <StatCard label="Registered" value={summary.registered_user_games} />
                <StatCard label="Guest" value={summary.guest_games} />
                <StatCard label="Abandoned" value={summary.abandoned} />
              </div>
            </section>

            {/* Outcomes */}
            <section className="mb-6">
              <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Outcomes</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Wins" value={summary.wins} />
                <StatCard label="Losses" value={summary.losses} />
                <StatCard
                  label="Win Rate"
                  value={summary.wins + summary.losses > 0
                    ? `${Math.round((summary.wins / (summary.wins + summary.losses)) * 100)}%`
                    : '—'}
                />
                <StatCard label="Avg Rounds" value={summary.avg_rounds ?? '—'} />
              </div>
            </section>

            {/* Engagement */}
            <section className="mb-6">
              <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Engagement</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Avg Duration" value={fmtDuration(summary.avg_duration_seconds)} />
                <StatCard
                  label="Guest Ratio"
                  value={summary.total_games > 0
                    ? `${Math.round((summary.guest_games / summary.total_games) * 100)}%`
                    : '—'}
                  sub="of all games"
                />
              </div>
            </section>

            {/* Daily chart */}
            <section className="bg-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-sm">Games per Day</h2>
                <div className="flex gap-1">
                  {[7, 14, 30].map(d => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${days === d ? 'btn-3d-accent text-white' : 'btn-glass text-white/70'}`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <BarChart data={daily} days={days} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
