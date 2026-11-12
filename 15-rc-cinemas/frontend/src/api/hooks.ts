import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type {
  AdminOverview,
  AuthResponse,
  Booking,
  Movie,
  Screen,
  Seat,
  SeatMap,
  Show,
  ShowFormat,
} from "@/api/types";
import { useAuthStore } from "@/store/auth";

// ---------- Auth ----------

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
      return data;
    },
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (payload: { email: string; full_name: string; password: string }) => {
      const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
      return data;
    },
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });
}

// ---------- Movies ----------

export function useMovies() {
  return useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data } = await apiClient.get<Movie[]>("/movies");
      return data;
    },
  });
}

export function useMovie(movieId: number | undefined) {
  return useQuery({
    queryKey: ["movies", movieId],
    queryFn: async () => {
      const { data } = await apiClient.get<Movie>(`/movies/${movieId}`);
      return data;
    },
    enabled: movieId !== undefined,
  });
}

export interface MovieFormInput {
  title: string;
  synopsis: string;
  genre: string;
  language: string;
  duration_minutes: number;
  cert: string;
  trailer_youtube_id: string;
  poster_url: string;
}

export function useCreateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MovieFormInput) => {
      const { data } = await apiClient.post<Movie>("/movies", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["movies"] }),
  });
}

export function useUpdateMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & Partial<MovieFormInput>) => {
      const { data } = await apiClient.patch<Movie>(`/movies/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["movies"] }),
  });
}

export function useDeleteMovie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/movies/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["movies"] }),
  });
}

// ---------- Screens ----------

export function useScreens() {
  return useQuery({
    queryKey: ["screens"],
    queryFn: async () => {
      const { data } = await apiClient.get<Screen[]>("/screens");
      return data;
    },
  });
}

export interface ScreenFormInput {
  name: string;
  rows: number;
  cols: number;
}

export function useCreateScreen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ScreenFormInput) => {
      const { data } = await apiClient.post<Screen>("/screens", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["screens"] }),
  });
}

export function useUpdateScreen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { data } = await apiClient.patch<Screen>(`/screens/${id}`, { name });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["screens"] }),
  });
}

export function useScreenSeats(screenId: number | undefined) {
  return useQuery({
    queryKey: ["screens", screenId, "seats"],
    queryFn: async () => {
      const { data } = await apiClient.get<Seat[]>(`/screens/${screenId}/seats`);
      return data;
    },
    enabled: screenId !== undefined,
  });
}

export function useDeleteScreen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/screens/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["screens"] }),
  });
}

// ---------- Shows ----------

export function useShows(params: { movieId?: number } = {}) {
  return useQuery({
    queryKey: ["shows", params.movieId],
    queryFn: async () => {
      const { data } = await apiClient.get<Show[]>("/shows", {
        params: params.movieId ? { movie_id: params.movieId } : undefined,
      });
      return data;
    },
    enabled: params.movieId === undefined || params.movieId > 0,
  });
}

export function useShow(showId: number | undefined) {
  return useQuery({
    queryKey: ["shows", "detail", showId],
    queryFn: async () => {
      const { data } = await apiClient.get<Show>(`/shows/${showId}`);
      return data;
    },
    enabled: showId !== undefined,
  });
}

export interface ShowFormInput {
  movie_id: number;
  screen_id: number;
  format: ShowFormat;
  start_time: string;
  price_classic: number;
  price_premium: number;
  price_recliner: number;
}

export function useCreateShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ShowFormInput) => {
      const { data } = await apiClient.post<Show>("/shows", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shows"] }),
  });
}

export function useUpdateShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number } & Partial<ShowFormInput>) => {
      const { data } = await apiClient.patch<Show>(`/shows/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shows"] }),
  });
}

export function useDeleteShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/shows/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shows"] }),
  });
}

export interface ShowBulkFormInput {
  movie_id: number;
  screen_id: number;
  format: ShowFormat;
  time_of_day: string; // "HH:MM"
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  days_of_week: number[]; // Monday=0 .. Sunday=6
  price_classic: number;
  price_premium: number;
  price_recliner: number;
}

export function useBulkCreateShows() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ShowBulkFormInput) => {
      const { data } = await apiClient.post<Show[]>("/shows/bulk", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shows"] }),
  });
}

// ---------- Seats / Bookings ----------

export function useSeatMap(showId: number | undefined) {
  return useQuery({
    queryKey: ["seatMap", showId],
    queryFn: async () => {
      const { data } = await apiClient.get<SeatMap>(`/shows/${showId}/seats`);
      return data;
    },
    enabled: showId !== undefined,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { show_id: number; seat_ids: number[] }) => {
      const { data } = await apiClient.post<Booking>("/bookings", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["seatMap", data.show_id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data } = await apiClient.get<Booking[]>("/bookings");
      return data;
    },
  });
}

// ---------- Admin ----------

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminOverview>("/admin/overview");
      return data;
    },
    refetchInterval: 30_000,
  });
}
