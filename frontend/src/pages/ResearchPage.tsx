import { useState } from 'react';
import { GraduationCap, Search, ExternalLink, Calendar, Users, FileText } from 'lucide-react';
import type { ResearchResponse, ResearchPaper } from '../types';
import { searchResearch } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function ResearchPage() {
  const [topic, setTopic] = useState('');
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const result = USE_MOCK
        ? await mockApi.searchResearch(trimmed)
        : await searchResearch({ topic: trimmed, max_results: 10 });
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
          <GraduationCap className="w-6 h-6 text-indigo-500" />
          Research Paper Search
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Search Google Scholar for academic papers and research articles.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='e.g. "retrieval augmented generation"'
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <LoadingSpinner size="sm" className="text-white" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <ErrorAlert message={error} />}

      {loading && (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-4">
            Searching Google Scholar... This may take a moment.
          </p>
        </div>
      )}

      {data && data.results.length === 0 && (
        <EmptyState
          title="No papers found"
          message="Try a different research topic or broader search terms."
        />
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Found {data.results.length} result{data.results.length !== 1 ? 's' : ''} for "{data.topic}"
          </p>
          {data.results.map((paper: ResearchPaper, i: number) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {paper.url ? (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {paper.title}
                        <ExternalLink className="w-3.5 h-3.5 inline ml-1 -mt-0.5" />
                      </a>
                    ) : (
                      paper.title
                    )}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
                    {paper.authors.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {paper.authors.join(', ')}
                      </span>
                    )}
                    {paper.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {paper.year}
                      </span>
                    )}
                    {paper.doi && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        DOI: {paper.doi}
                      </span>
                    )}
                  </div>

                  {paper.snippet && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <span className="text-xs text-gray-400 font-medium">Snippet: </span>
                      {paper.snippet}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400 text-center mt-4">
            Results are search snippets from Google Scholar, not full-paper summaries.
          </p>
        </div>
      )}
    </div>
  );
}
