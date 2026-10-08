import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  History,
  Leaf,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { predictionService } from '../services';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuth } from '../context/AuthContext';
import DashboardCard from '../components/DashboardCard';
import PredictionCard from '../components/PredictionCard';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LinkButton from '../components/LinkButton';
import { SkeletonList } from '../components/LoadingSpinner';

/**
 * User dashboard (`/dashboard`).
 *
 * Aggregates `/predictions/stats/my` for the tiles and the 7-day chart, and
 * reuses `/predictions/my` for the recent-scans list, so the page never needs a
 * separate "recent activity" endpoint.
 */
export default function UserDashboard() {
  const { user } = useAuth();

  const stats = useAsyncData(() => predictionService.getMyStats(), []);
  const recent = useAsyncData(() => predictionService.getMine({ page: 1, limit: 3 }), []);

  const summary = stats.data?.data || null;
  const statusCounts = summary?.statusCounts || {};
  const latest = recent.data?.data || [];

  const firstName = (user?.name || 'there').split(' ')[0];

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------------- welcome */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-6 bg-gradient-to-br from-leaf-600 to-leaf-800 p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-leaf-100">Welcome back</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Hello, {firstName}</h1>
            <p className="mt-2 max-w-xl text-sm text-leaf-100">
              Upload a leaf photo to identify a disease and get its remedy plan, then track every
              scan you have run.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/detect"
              className="btn bg-white text-leaf-800 shadow-sm hover:bg-leaf-50 active:scale-[0.98]"
            >
              <ScanLine className="h-4 w-4" />
              Detect disease
            </Link>
            <Link
              to="/diseases"
              className="btn border border-white/40 text-white hover:bg-white/10"
            >
              <Leaf className="h-4 w-4" />
              Disease library
            </Link>
          </div>
        </div>
      </section>

      {stats.error ? (
        <ErrorMessage title="Could not load your statistics" message={stats.error} onDismiss={stats.reload} />
      ) : null}

      {/* ----------------------------------------------------------- tiles */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Total scans"
          value={stats.loading ? '—' : (summary?.totalScans ?? 0)}
          hint="Images you have analysed"
          icon={ScanLine}
          tone="leaf"
          to="/history"
        />
        <DashboardCard
          label="Diseases detected"
          value={stats.loading ? '—' : (statusCounts.detected ?? 0)}
          hint="Confidence of 70% or more"
          icon={AlertTriangle}
          tone="amber"
        />
        <DashboardCard
          label="Healthy leaves"
          value={stats.loading ? '—' : (statusCounts.healthy ?? 0)}
          hint="No disease found"
          icon={CheckCircle2}
          tone="sky"
        />
        <DashboardCard
          label="Low confidence"
          value={stats.loading ? '—' : (statusCounts.low_confidence ?? 0)}
          hint="Worth re-scanning"
          icon={Activity}
          tone="violet"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------------------------------- 7-day activity */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Last 7 days</h2>
              <p className="mt-0.5 text-sm text-leaf-600 dark:text-leaf-400">
                Scans per day
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-leaf-500" />
          </div>

          <WeeklyChart activity={summary?.weeklyActivity || []} loading={stats.loading} />
        </section>

        {/* -------------------------------------------------- top diseases */}
        <section className="card p-6">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
            <h2 className="text-lg font-semibold">Most detected</h2>
          </div>

          {stats.loading ? (
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-leaf-100 dark:bg-leaf-800" />
              ))}
            </div>
          ) : summary?.topDiseases?.length ? (
            <ul className="mt-5 space-y-3">
              {summary.topDiseases.map((item, index) => {
                const share = Math.round((item.count / (summary.mostDetectedDisease?.count || 1)) * 100);
                return (
                  <li key={item._d || `disease-${index}`}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium">
                        {item.plantName ? `${item.plantName} — ` : ''}
                        {item._id}
                      </span>
                      <span className="shrink-0 text-leaf-600 dark:text-leaf-400">
                        {item.count} scan{item.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
                      <div
                        className="h-full rounded-full bg-leaf-500"
                        style={{ width: `${Math.max(6, share)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-leaf-600 dark:text-leaf-400">
              No scans yet. Your most frequent results will appear here.
            </p>
          )}
        </section>
      </div>

      {/* -------------------------------------------------- recent scans */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent scans</h2>
          {latest.length > 0 ? (
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-600 hover:underline dark:text-leaf-400"
            >
              <History className="h-4 w-4" />
              View all
            </Link>
          ) : null}
        </div>

        {recent.loading ? (
          <SkeletonList count={3} />
        ) : recent.error ? (
          <ErrorMessage message={recent.error} onDismiss={recent.reload} />
        ) : latest.length > 0 ? (
          <div className="space-y-3">
            {latest.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ScanLine}
            title="No scans yet"
            message="Analyse your first leaf image to see it here with its remedy plan."
            actionTo="/detect"
            actionLabel="Detect a disease"
          />
        )}
      </section>

      <div className="text-center">
        <LinkButton to="/diseases" variant="secondary">
          Browse the disease knowledge base
        </LinkButton>
      </div>
    </div>
  );
}

/**
 * Minimal bar chart for the last 7 days.
 *
 * The API only returns the days that have scans, so missing days are filled in
 * here to keep the axis honest instead of drawing a gap.
 */
function WeeklyChart({ activity, loading }) {
  const days = buildWeek(activity);
  const max = Math.max(1, ...days.map((day) => day.count));

  if (!loading && days.every((day) => day.count === 0)) {
    return (
      <p className="mt-8 text-sm text-leaf-600 dark:text-leaf-400">
        No activity in the last 7 days. Run a detection to start your trend.
      </p>
    );
  }

  return (
    <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3" aria-hidden="true">
      {days.map((day) => (
        <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-leaf-600 dark:text-leaf-400">
            {day.count || ''}
          </span>
          <div className="flex h-full w-full items-end">
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${
                day.count > 0 ? 'bg-leaf-500' : 'bg-leaf-100 dark:bg-leaf-800'
              }`}
              style={{ height: day.count ? `${Math.max(8, (day.count / max) * 100)}%` : '6%' }}
            />
          </div>
          <span className="text-[11px] font-medium uppercase text-leaf-500">{day.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Fills in the missing days so the chart always shows 7 bars. */
function buildWeek(activity) {
  const byKey = new Map((activity || []).map((item) => [item._id, item.count]));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      count: byKey.get(key) || 0,
    };
  });
}
