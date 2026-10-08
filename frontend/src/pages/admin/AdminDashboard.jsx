import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Gauge,
  Leaf,
  ScanLine,
  Users,
} from 'lucide-react';
import { adminService } from '../../services';
import { useAsyncData } from '../../hooks/useAsyncData';
import DashboardCard from '../../components/DashboardCard';
import PredictionCard from '../../components/PredictionCard';
import ErrorMessage from '../../components/ErrorMessage';
import LinkButton from '../../components/LinkButton';
import { SkeletonList } from '../../components/LoadingSpinner';
import { severityStyle } from '../../utils/constants';
import { formatPercent } from '../../utils/formatters';

/**
 * Admin dashboard (`/admin`).
 *
 * `/admin/statistics` carries every counter and chart, `/admin/ml-health`
 * reports whether real inference is available. Those two together let an admin
 * tell "the system is working" apart from "the system is working but returning
 * demo results", which matters for a demo of an ML project.
 */
export default function AdminDashboard() {
  const stats = useAsyncData(() => adminService.statistics(), []);
  const health = useAsyncData(() => adminService.mlHealth(), []);

  const data = stats.data?.data || null;
  const totals = data?.totals;
  const ml = health.data?.data || null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-leaf-600 dark:text-leaf-400">
            System-wide activity, content and AI service status.
          </p>
        </div>
        <MlStatusCard health={ml} loading={health.loading} error={health.error} />
      </div>

      {stats.error ? (
        <ErrorMessage
          title="Could not load the statistics"
          message={stats.error}
          onDismiss={stats.reload}
        />
      ) : null}

      {/* ----------------------------------------------------------- tiles */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Registered users"
          value={stats.loading ? '—' : (totals?.users ?? 0)}
          hint={`${totals?.activeUsers ?? 0} active`}
          icon={Users}
          tone="sky"
          to="/admin/users"
        />
        <DashboardCard
          label="Knowledge-base diseases"
          value={stats.loading ? '—' : (totals?.diseases ?? 0)}
          hint="Remedy records"
          icon={Leaf}
          tone="leaf"
          to="/admin/diseases"
        />
        <DashboardCard
          label="Total predictions"
          value={stats.loading ? '—' : (totals?.predictions ?? 0)}
          hint="All users"
          icon={ScanLine}
          tone="violet"
          to="/admin/predictions"
        />
        <DashboardCard
          label="Average confidence"
          value={stats.loading ? '—' : formatPercent(totals?.averageConfidence ?? 0)}
          hint="Across all stored scans"
          icon={Gauge}
          tone="amber"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* -------------------------------------------- status breakdown */}
        <section className="card p-6">
          <div className="flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
            <h2 className="text-lg font-semibold">Prediction outcomes</h2>
          </div>

          {stats.loading ? (
            <div className="mt-5 h-40 animate-pulse rounded-xl bg-leaf-100 dark:bg-leaf-800" />
          ) : (
            <BreakdownList
              items={[
                { key: 'detected', label: 'Disease detected', value: data?.statusBreakdown?.detected || 0, tone: 'bg-red-500' },
                { key: 'healthy', label: 'Healthy leaf', value: data?.statusBreakdown?.healthy || 0, tone: 'bg-leaf-500' },
                {
                  key: 'low_confidence',
                  label: 'Low confidence',
                  value: data?.statusBreakdown?.low_confidence || 0,
                  tone: 'bg-amber-500',
                },
                { key: 'failed', label: 'Failed', value: data?.statusBreakdown?.failed || 0, tone: 'bg-slate-400' },
              ]}
            />
          )}
        </section>

        {/* ------------------------------------------------- severity mix */}
        <section className="card p-6">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
            <h2 className="text-lg font-semibold">Severity of the knowledge base</h2>
          </div>

          {stats.loading ? (
            <div className="mt-5 h-40 animate-pulse rounded-xl bg-leaf-100 dark:bg-leaf-800" />
          ) : data?.severityBreakdown?.length ? (
            <ul className="mt-5 space-y-3">
              {data.severityBreakdown.map((item) => {
                const style = severityStyle(item.name);
                const total = data.severityBreakdown.reduce((sum, entry) => sum + entry.count, 0);
                return (
                  <li key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`badge ${style.badge}`}>{item.name}</span>
                      <span className="text-leaf-600 dark:text-leaf-400">{item.count} records</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{ width: `${Math.max(4, (item.count / total) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-leaf-600 dark:text-leaf-400">
              No disease records yet. Add the knowledge base to see the severity mix.
            </p>
          )}
        </section>
      </div>

      {/* -------------------------------------------------- top diseases */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-leaf-600 dark:text-leaf-400" />
            <h2 className="text-lg font-semibold">Most detected diseases</h2>
          </div>
          <Link to="/admin/diseases" className="text-sm font-semibold text-leaf-600 hover:underline dark:text-leaf-400">
            Manage diseases
          </Link>
        </div>

        {stats.loading ? (
          <div className="mt-5 h-32 animate-pulse rounded-xl bg-leaf-100 dark:bg-leaf-800" />
        ) : data?.topDiseases?.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Plant</th>
                  <th className="text-right">Predictions</th>
                </tr>
              </thead>
              <tbody>
                {data.topDiseases.map((item) => (
                  <tr key={item.name}>
                    <td className="font-medium">{item.name}</td>
                    <td>{item.plantName || '—'}</td>
                    <td className="text-right font-semibold">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 text-sm text-leaf-600 dark:text-leaf-400">
            No predictions recorded yet.
          </p>
        )}
      </section>

      {/* ---------------------------------------------- recent activity */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Latest predictions</h2>
          <Link
            to="/admin/predictions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-600 hover:underline dark:text-leaf-400"
          >
            View all
          </Link>
        </div>

        {stats.loading ? (
          <SkeletonList count={3} />
        ) : data?.recentPredictions?.length ? (
          <div className="space-y-3">
            {data.recentPredictions.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} showUser />
            ))}
          </div>
        ) : (
          <p className="text-sm text-leaf-600 dark:text-leaf-400">Nothing has been analysed yet.</p>
        )}
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <LinkButton to="/admin/users" variant="secondary">
          <Users className="h-4 w-4" />
          Manage users
        </LinkButton>
        <LinkButton to="/admin/diseases" variant="secondary">
          <Leaf className="h-4 w-4" />
          Manage diseases
        </LinkButton>
        <LinkButton to="/admin/predictions" variant="secondary">
          <ScanLine className="h-4 w-4" />
          Manage predictions
        </LinkButton>
      </div>
    </div>
  );
}

/**
 * AI service status.
 *
 * Deliberately distinguishes "reachable" from "a real model is loaded": a
 * reachable service with no model file is serving demo results, and the admin
 * should see that rather than assume the model is live.
 */
function MlStatusCard({ health, loading, error }) {
  const reachable = Boolean(health?.reachable);
  const modelLoaded = Boolean(health?.details?.model_loaded ?? health?.details?.model_available);
  const classCount = health?.details?.num_classes;

  const state = loading
    ? { tone: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-800 dark:text-leaf-200', label: 'Checking...' }
    : error || !reachable
      ? {
          tone: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
          label: 'ML service unreachable',
        }
      : modelLoaded
        ? {
            tone: 'bg-leaf-100 text-leaf-800 dark:bg-leaf-900 dark:text-leaf-200',
            label: 'Model loaded — real inference',
          }
        : {
            tone: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
            label: 'Service up — demo (mock) results',
          };

  return (
    <div className={`rounded-2xl px-4 py-3 ${state.tone}`}>
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4" />
        <p className="text-sm font-semibold">{state.label}</p>
      </div>
      <p className="mt-1 text-xs opacity-80">
        {health?.latencyMs !== undefined ? `${health.latencyMs} ms round trip` : 'AI prediction service'}
        {classCount ? ` • ${classCount} classes` : ''}
      </p>
    </div>
  );
}

/** Horizontal proportion bars for the outcome breakdown. */
function BreakdownList({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-leaf-600 dark:text-leaf-400">{item.value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-leaf-100 dark:bg-leaf-800">
            <div
              className={`h-full rounded-full ${item.tone}`}
              style={{ width: `${total ? Math.max(2, (item.value / total) * 100) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
