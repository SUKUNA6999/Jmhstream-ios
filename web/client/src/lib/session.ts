const SESSION_KEY = "jmh_session_id";

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem("jmh_admin_token");
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem("jmh_admin_token", token);
}

export function removeAdminToken(): void {
  sessionStorage.removeItem("jmh_admin_token");
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}
