export type UserRole = "user" | "admin";

export type ShowFormat = "2D" | "3D" | "Dolby Atmos" | "4DX";

export type BookingStatus = "confirmed" | "cancelled";

export type SeatTier = "classic" | "premium" | "recliner";

export const SEAT_TIER_LABEL: Record<SeatTier, string> = {
  classic: "Classic",
  premium: "Premium",
  recliner: "Recliner",
};

export const SEAT_TIER_BLURB: Record<SeatTier, string> = {
  classic: "Standard view",
  premium: "Center block, best view",
  recliner: "Back row, wide lounger",
};

export const SEAT_TIER_COLOR: Record<SeatTier, string> = {
  classic: "#A8A29A",
  premium: "#D4AF37",
  recliner: "#8B6FE8",
};

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Movie {
  id: number;
  title: string;
  synopsis: string;
  genre: string;
  language: string;
  duration_minutes: number;
  cert: string;
  trailer_youtube_id: string;
  poster_url: string;
}

export interface Screen {
  id: number;
  name: string;
  rows: number;
  cols: number;
}

export interface Show {
  id: number;
  movie_id: number;
  screen_id: number;
  format: ShowFormat;
  start_time: string;
  price_classic: number;
  price_premium: number;
  price_recliner: number;
  movie: Movie;
  screen: Screen;
}

export function priceForTier(show: Pick<Show, "price_classic" | "price_premium" | "price_recliner">, tier: SeatTier): number {
  return tier === "premium" ? show.price_premium : tier === "recliner" ? show.price_recliner : show.price_classic;
}

export interface Seat {
  id: number;
  row_label: string;
  col_number: number;
  label: string;
  tier: SeatTier;
}

export interface SeatMapEntry {
  id: number;
  row_label: string;
  col_number: number;
  label: string;
  tier: SeatTier;
  taken: boolean;
}

export interface SeatMap {
  show_id: number;
  rows: number;
  cols: number;
  seats: SeatMapEntry[];
}

export interface Booking {
  id: number;
  show_id: number;
  total_amount: number;
  status: BookingStatus;
  created_at: string;
  show: Show;
  seat_labels: string[];
}

export interface AdminBookingSummary {
  id: number;
  movie_title: string;
  screen_name: string;
  user_name: string;
  seat_labels: string[];
  total_amount: number;
  created_at: string;
}

export interface AdminOverview {
  total_movies: number;
  total_screens: number;
  total_seats: number;
  total_shows: number;
  shows_today: number;
  upcoming_shows: number;
  total_bookings: number;
  seats_booked: number;
  total_revenue: number;
  revenue_today: number;
  upcoming: Show[];
  recent_bookings: AdminBookingSummary[];
}
