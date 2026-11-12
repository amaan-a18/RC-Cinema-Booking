import axios from "axios";
import { useAuthStore } from "@/store/auth";

// Vite's dev server proxies /api -> the FastAPI backend (see vite.config.ts).
// In production, set VITE_API_BASE_URL to the deployed backend's origin.
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    if (detail && typeof detail === "object" && "message" in detail) {
      return String((detail as { message?: string }).message ?? "Request failed");
    }
    return error.message;
  }
  return "Something went wrong";
}
