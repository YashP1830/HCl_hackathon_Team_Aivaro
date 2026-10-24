import { useState } from 'react';
import { BarChart3, TrendingUp, Search, FileText } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AnalyticsResponse, ChartData } from '../types';
import { getAnalytics } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0284c7', '#7c3aed', '#db2777'];

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export default function AdminAnalyticsPage() {
  const defaults = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = USE_MOCK
        ? await mockApi.getAnalytics()
        : await getAnalytics({ from: fromDate, to: toDate });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
          Purchase Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View purchase metrics, trends, and AI-generated insights.
        </p>
      </div>

      {/* Date range picker */}
      <form onSubmit={handleFetch} className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <LoadingSpinner size="sm" className="text-white" /> : <Search className="w-4 h-4" />}
          Generate Report
        </button>
      </form>

      {error && <ErrorAlert message={error} onRetry={handleFetch} />}

      {loading && (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-4">Calculating metrics and generating insights...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(data.metrics).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
                  {typeof value === 'string' && value.startsWith('+') && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                  {String(value)}
                </p>
              </div>
            ))}
          </div>

          {/* LLM Narrative */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-indigo-500" />
              AI-Generated Insights
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {data.narrative}
            </p>
          </div>

          {/* Charts */}
          {data.charts.map((chart: ChartData, idx: number) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">{chart.title}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.chart_type === 'bar' ? (
                    <BarChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chart.x_key} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {chart.series.map((s, si) => (
                        <Bar key={s.data_key} dataKey={s.data_key} name={s.label} fill={COLORS[si % COLORS.length]} />
                      ))}
                    </BarChart>
                  ) : chart.chart_type === 'line' ? (
                    <LineChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chart.x_key} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {chart.series.map((s, si) => (
                        <Line key={s.data_key} dataKey={s.data_key} name={s.label} stroke={COLORS[si % COLORS.length]} strokeWidth={2} />
                      ))}
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        dataKey={chart.series[0]?.data_key || 'value'}
                        nameKey={chart.x_key}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {chart.data.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400 text-center">
            Metrics are calculated from confirmed purchase events. Narrative and chart proposals are AI-generated explanations of precomputed data.
          </p>
        </div>
      )}
    </div>
  );
}
