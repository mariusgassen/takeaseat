export type Role = "admin" | "manager" | "member" | "guest";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  signIn: () => void;
  signOut: () => void;
  loading: boolean;
}
