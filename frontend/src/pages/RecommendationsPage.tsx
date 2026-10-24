import { useState } from 'react';
import { Sparkles, Send, BookOpen, ExternalLink } from 'lucide-react';
import type { RecommendationResponse, RecommendationItem } from '../types';
import { getRecommendations } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import { LibraryStatusBadge } from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function RecommendationsPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const result = USE_MOCK
        ? await mockApi.getRecommendations(trimmed)
        : await getRecommendations({ query: trimmed, top_k: 8 });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Group recommendations by status for clear visual separation
  const grouped = data
    ? {
        available: data.recommendations.filter((r) => r.library_status === 'in_library_available'),
        outOfStock: data.recommendations.filter((r) => r.library_status === 'in_library_out_of_stock'),
        external: data.recommendations.filter((r) => r.library_status === 'not_in_library'),
      }
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" />
          Book Recommendations
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask for book suggestions — we'll search our library and suggest additional reading.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "Suggest me books on Generative AI"'
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            disabled={loading}
            minLength={2}
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <LoadingSpinner size="sm" className="text-white" /> : <Send className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Get Recommendations'}
          </button>
        </div>
      </form>

      {error && <ErrorAlert message={error} onRetry={() => { void handleSearch(); }} />}

      {loading && (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-4">
            Searching library and generating suggestions... This may take a moment.
          </p>
        </div>
      )}

      {data && data.recommendations.length === 0 && (
        <EmptyState
          title="No recommendations found"
          message="Try rephrasing your query or searching for a different topic."
        />
      )}

      {grouped && (
        <div className="space-y-8">
          {/* Available in library */}
          {grouped.available.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Available in Our Library
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.available.map((rec, i) => (
                  <RecommendationCard key={`avail-${i}`} item={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Out of stock */}
          {grouped.outOfStock.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                In Our Library — Currently Out of Stock
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.outOfStock.map((rec, i) => (
                  <RecommendationCard key={`oos-${i}`} item={rec} />
                ))}
              </div>
            </section>
          )}

          {/* External suggestions */}
          {grouped.external.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-slate-500" />
                Additional Suggestions (Not in Our Library)
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                These are AI-generated suggestions for further reading. They are not part of our catalog.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped.external.map((rec, i) => (
                  <RecommendationCard key={`ext-${i}`} item={rec} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900">{item.book_name}</h3>
        <LibraryStatusBadge status={item.library_status} />
      </div>
      <p className="text-sm text-gray-500 mb-2">{item.author}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
      {item.book_id && (
        <a
          href={`/catalog/${item.book_id}`}
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-3"
        >
          View in catalog →
        </a>
      )}
    </div>
  );
}
