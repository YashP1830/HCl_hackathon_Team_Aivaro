import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import type { Loan } from '../types';
import { getMyLoans, returnLoan } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dueAt: string, returnedAt: string | null) {
  return !returnedAt && new Date(dueAt) < new Date();
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returning, setReturning] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = USE_MOCK ? await mockApi.getMyLoans() : await getMyLoans();
      setLoans(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleReturn = async (loanId: string) => {
    setReturning(loanId);
    try {
      const updated = USE_MOCK
        ? { ...loans.find((l) => l.id === loanId)!, returned_at: new Date().toISOString() }
        : await returnLoan(loanId);
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReturning(null);
    }
  };

  const active = loans.filter((l) => !l.returned_at);
  const returned = loans.filter((l) => l.returned_at);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          My Loans
        </h1>
        <p className="text-sm text-gray-500 mt-1">View your borrowed books and due dates.</p>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchLoans} />}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : loans.length === 0 ? (
        <EmptyState
          title="No loans yet"
          message="You haven't borrowed any books. Browse the catalog to find something to read!"
          icon={<BookOpen className="w-12 h-12 text-gray-300 mb-4" />}
        />
      ) : (
        <div className="space-y-8">
          {/* Active loans */}
          {active.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Active Loans ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((loan) => {
                  const overdue = isOverdue(loan.due_at, loan.returned_at);
                  return (
                    <div
                      key={loan.id}
                      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                        overdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {loan.book_title || `Book ${loan.book_id.slice(0, 8)}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Borrowed: {formatDate(loan.borrowed_at)}
                          </span>
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              overdue ? 'text-red-600' : 'text-gray-600'
                            }`}
                          >
                            {overdue ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            Due: {formatDate(loan.due_at)}
                          </span>
                        </div>
                        {overdue && (
                          <p className="text-xs text-red-600 mt-1 font-medium">
                            ⚠ This book is overdue. Please return it as soon as possible.
                          </p>
                        )}
                        {loan.reminder_sent_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Reminder sent: {formatDate(loan.reminder_sent_at)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleReturn(loan.id)}
                        disabled={returning === loan.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {returning === loan.id ? (
                          <LoadingSpinner size="sm" className="text-white" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Return Book
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Returned */}
          {returned.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Returned ({returned.length})
              </h2>
              <div className="space-y-3">
                {returned.map((loan) => (
                  <div
                    key={loan.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-700">
                        {loan.book_title || `Book ${loan.book_id.slice(0, 8)}`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-1">
                        <span>Borrowed: {formatDate(loan.borrowed_at)}</span>
                        <span>Due: {formatDate(loan.due_at)}</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Returned: {formatDate(loan.returned_at!)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
