// Auth

export interface LoginResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

export interface RegisterResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}