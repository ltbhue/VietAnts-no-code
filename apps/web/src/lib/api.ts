export type UserRole = "ADMIN" | "TESTER" | "VIEWER";

/** Base URL API (backend Express) */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function authJsonHeaders(): HeadersInit {
  const token = getAuthToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const h: Record<string, string> = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function getUserRole(): UserRole | null {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return null;
    const u = JSON.parse(raw) as { role?: string };
    const r = u.role;
    if (r === "ADMIN" || r === "TESTER" || r === "VIEWER") return r;
    return null;
  } catch {
    return null;
  }
}

export function canAccessProjects(role: UserRole | null): boolean {
  return role === "ADMIN";
}

export function canMutateNoCode(role: UserRole | null): boolean {
  return role === "ADMIN" || role === "TESTER";
}

/** Tải PDF có Bearer (trình duyệt không gửi header khi mở URL trần) */
export async function downloadRunPdf(runId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/runs/${runId}/report.pdf`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Lỗi ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `testrun-${runId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
