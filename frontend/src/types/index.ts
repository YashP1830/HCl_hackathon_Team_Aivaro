// ─── Book Types ─────────────────────────────────────────────────────────
export interface BookCreate {
  title: string;
  author?: string;
  description?: string;
  genre?: string | null;
  publisher?: string | null;
  publication_year?: number | null;
  stock_quantity?: number;
}

export interface BookUpdate {
  title?: string | null;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
  publisher?: string | null;
  publication_year?: number | null;
  stock_quantity?: number | null;
}

export type AvailabilityStatus = 'available' | 'out_of_stock';
export type EmbeddingStatus = 'pending' | 'ready' | 'failed';

export interface BookRead {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string | null;
  publisher: string | null;
  publication_year: number | null;
  stock_quantity: number;
  availability_status: AvailabilityStatus;
  embedding_status: EmbeddingStatus;
  created_at: string;
  updated_at: string;
}

export interface PaginatedBooks {
  items: BookRead[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ─── Recommendation Types ───────────────────────────────────────────────
export type LibraryStatus =
  | 'in_library_available'
  | 'in_library_out_of_stock'
  | 'not_in_library';

export interface RecommendationItem {
  book_name: string;
  author: string;
  description: string;
  library_status: LibraryStatus;
  book_id: string | null;
}

export interface RecommendationRequest {
  query: string;
  top_k?: number;
}

export interface RecommendationResponse {
  query: string;
  recommendations: RecommendationItem[];
}

// ─── FAQ Types ──────────────────────────────────────────────────────────
export type FAQStatus = 'answered' | 'fallback' | 'error';

export interface FAQRequest {
  question: string;
}

export interface FAQSource {
  faq_id: string;
  question: string;
}

export interface FAQResponse {
  answer: string;
  status: FAQStatus;
  support_contact: string | null;
  sources: FAQSource[];
}

// ─── Research Types ─────────────────────────────────────────────────────
export interface ResearchRequest {
  topic: string;
  max_results?: number;
}

export interface ResearchPaper {
  title: string;
  authors: string[];
  year: number | null;
  snippet: string | null;
  url: string | null;
  doi: string | null;
}

export interface ResearchResponse {
  topic: string;
  results: ResearchPaper[];
}

// ─── Loan Types ─────────────────────────────────────────────────────────
export interface Loan {
  id: string;
  user_id: string;
  book_id: string;
  book_title?: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  reminder_sent_at: string | null;
}

// ─── Analytics Types ────────────────────────────────────────────────────
export interface ChartSeries {
  data_key: string;
  label: string;
}

export interface ChartData {
  title: string;
  chart_type: 'bar' | 'line' | 'pie';
  x_key: string;
  series: ChartSeries[];
  data: Record<string, string | number>[];
}

export interface AnalyticsResponse {
  period: { from: string; to: string };
  metrics: Record<string, number | string>;
  narrative: string;
  charts: ChartData[];
}

// ─── Auth Types ─────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

// ─── API Error ──────────────────────────────────────────────────────────
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
  request_id?: string;
}
