import { api } from "@/shared/api-client/client";
import type { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from "@/shared/types/api";

/** Authentication endpoints (design doc 6.2). */
export const authApi = {
  login: (body: LoginRequest) => api.post<AuthResponse>("/auth/login", body),
  register: (body: RegisterRequest) => api.post<AuthResponse>("/auth/register", body),
  /** Uses the httpOnly refresh cookie; returns a new access token. */
  refresh: () => api.post<AuthResponse>("/auth/refresh"),
  logout: () => api.post<void>("/auth/logout"),
  me: () => api.get<CurrentUser>("/users/me"),
};
