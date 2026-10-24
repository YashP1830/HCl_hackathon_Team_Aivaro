import client from './client';
import type {
  BookRead,
  BookCreate,
  BookUpdate,
  PaginatedBooks,
  RecommendationRequest,
  RecommendationResponse,
  FAQRequest,
  FAQResponse,
  ResearchRequest,
  ResearchResponse,
  Loan,
  AnalyticsResponse,
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  User,
} from '../types';

// ─── Auth ───────────────────────────────────────────────────────────────
export async function login(data: LoginRequest): Promise<AuthTokens> {
  // FastAPI's OAuth2PasswordRequestForm expects form data
  const form = new URLSearchParams();
  form.append('username', data.email);
  form.append('password', data.password);
  const res = await client.post<AuthTokens>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

export async function register(data: RegisterRequest): Promise<User> {
  const res = await client.post<User>('/auth/register', data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await client.get<User>('/users/me');
  return res.data;
}

// ─── Books ──────────────────────────────────────────────────────────────
export async function listBooks(params: {
  q?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedBooks> {
  const res = await client.get<PaginatedBooks>('/books', { params });
  return res.data;
}

export async function getBook(bookId: string): Promise<BookRead> {
  const res = await client.get<BookRead>(`/books/${bookId}`);
  return res.data;
}

export async function createBook(data: BookCreate): Promise<{ book: BookRead; embedding_status: string }> {
  const res = await client.post<{ book: BookRead; embedding_status: string }>('/admin/books', data);
  return res.data;
}

export async function updateBook(
  bookId: string,
  data: BookUpdate,
): Promise<{ book: BookRead; embedding_status: string }> {
  const res = await client.patch<{ book: BookRead; embedding_status: string }>(
    `/admin/books/${bookId}`,
    data,
  );
  return res.data;
}

// ─── Recommendations ────────────────────────────────────────────────────
export async function getRecommendations(
  data: RecommendationRequest,
): Promise<RecommendationResponse> {
  const res = await client.post<RecommendationResponse>('/recommendations', data);
  return res.data;
}

// ─── FAQ ────────────────────────────────────────────────────────────────
export async function askFAQ(data: FAQRequest): Promise<FAQResponse> {
  const res = await client.post<FAQResponse>('/chat/faq', data);
  return res.data;
}

// ─── Research ───────────────────────────────────────────────────────────
export async function searchResearch(data: ResearchRequest): Promise<ResearchResponse> {
  const res = await client.post<ResearchResponse>('/research/search', data);
  return res.data;
}

// ─── Loans ──────────────────────────────────────────────────────────────
export async function getMyLoans(): Promise<Loan[]> {
  const res = await client.get<Loan[]>('/loans/me');
  return res.data;
}

export async function returnLoan(loanId: string): Promise<Loan> {
  const res = await client.post<Loan>(`/loans/${loanId}/return`);
  return res.data;
}

// ─── Analytics ──────────────────────────────────────────────────────────
export async function getAnalytics(params: {
  from: string;
  to: string;
}): Promise<AnalyticsResponse> {
  const res = await client.get<AnalyticsResponse>('/admin/analytics', { params });
  return res.data;
}
