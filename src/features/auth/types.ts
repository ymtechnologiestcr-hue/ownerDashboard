export interface User {
  id: number;
  email?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}