"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recorder", label: "Recorder" },
  { href: "/editor", label: "Biên tập" },
  { href: "/suite-runs", label: "Suite" },
  { href: "/admin/roles", label: "Vai trò" },
  { href: "/scripts", label: "Kịch bản" },
  { href: "/objects", label: "Đối tượng UI" },
  { href: "/datasets", label: "Bộ dữ liệu" },
  { href: "/reports", label: "Báo cáo" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const bare = pathname === "/login" || pathname === "/";
  if (bare) {
    return <>{children}</>;
  }

  function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-semibold text-emerald-400 text-sm">
            Vietants Testing
          </Link>
          <nav className="flex flex-wrap gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  pathname === l.href || pathname.startsWith(l.href + "/")
                    ? "bg-emerald-600 text-slate-950 font-medium"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white px-2"
        >
          Đăng xuất
        </button>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
