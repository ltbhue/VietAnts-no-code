"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getUserRole, type UserRole } from "@/lib/api";
import {
  FiBarChart2,
  FiBookOpen,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiDatabase,
  FiEdit3,
  FiFileText,
  FiFolder,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiShield,
  FiX,
} from "react-icons/fi";

type MenuLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
};

const menuGroups = [
  {
    title: "Tổng quan",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: FiBarChart2 },
      { href: "/projects", label: "Project", icon: FiFolder, roles: ["ADMIN"] },
    ],
  },
  {
    title: "No-code mới",
    links: [
      { href: "/recorder", label: "Recorder", icon: FiClipboard, roles: ["ADMIN", "TESTER"] },
      { href: "/editor", label: "Biên tập", icon: FiEdit3, roles: ["ADMIN", "TESTER"] },
      { href: "/suite-runs", label: "Suite", icon: FiLayers, roles: ["ADMIN", "TESTER"] },
    ],
  },
  {
    title: "Nghiệp vụ cũ",
    links: [
      { href: "/scripts", label: "Kịch bản", icon: FiBookOpen, roles: ["ADMIN", "TESTER", "VIEWER"] },
      { href: "/objects", label: "Đối tượng UI", icon: FiBox, roles: ["ADMIN", "TESTER", "VIEWER"] },
      { href: "/datasets", label: "Bộ dữ liệu", icon: FiDatabase, roles: ["ADMIN", "TESTER", "VIEWER"] },
      { href: "/reports", label: "Báo cáo", icon: FiFileText, roles: ["ADMIN", "TESTER", "VIEWER"] },
    ],
  },
  {
    title: "Hệ thống",
    links: [{ href: "/admin/roles", label: "Vai trò", icon: FiShield, roles: ["ADMIN"] }],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const role = getUserRole();
  const bare = pathname === "/login" || pathname === "/";
  const userInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return { name: "Tài khoản", email: "" };
      const user = JSON.parse(raw) as { fullName?: string; email?: string };
      return {
        name: user.fullName || user.email || "Tài khoản",
        email: user.email || "",
      };
    } catch {
      return { name: "Tài khoản", email: "" };
    }
  }, [pathname]);

  const visibleMenuGroups = useMemo(
    () =>
      menuGroups
        .map((group) => ({
          ...group,
          links: group.links.filter((link) => !link.roles || (role && link.roles.includes(role))),
        }))
        .filter((group) => group.links.length > 0),
    [role],
  );

  const canAccessCurrentPath = useMemo(() => {
    if (bare) return true;
    const allLinks = menuGroups.flatMap((g) => g.links);
    const matched = allLinks.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`));
    if (!matched) return true;
    if (!matched.roles) return true;
    return !!role && matched.roles.includes(role);
  }, [bare, pathname, role]);

  useEffect(() => {
    if (bare) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!canAccessCurrentPath) {
      router.replace("/dashboard");
    }
  }, [bare, canAccessCurrentPath, router]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  if (bare) return <>{children}</>;

  function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    router.push("/login");
  }

  const avatarLabel = (userInfo.name.trim().charAt(0) || "U").toUpperCase();

  return (
    <div className="h-screen overflow-hidden flex">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg border border-slate-700"
      >
        <span className="inline-flex items-center gap-2">
          <FiMenu className="h-4 w-4" />
          Menu
        </span>
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${collapsed ? "w-20" : "w-64"} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:static left-0 top-0 h-full shrink-0 border-r border-slate-800 bg-slate-900/95 backdrop-blur px-3 py-4 flex flex-col gap-3 z-50 transition-all duration-300 ease-out`}
      >
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="font-semibold text-emerald-400 text-sm px-2 truncate transition-all duration-200">
            {collapsed ? "VT" : "Vietants Testing"}
          </Link>
          <button
            type="button"
            onClick={() =>
              setCollapsed((v) => {
                const next = !v;
                localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
                return next;
              })
            }
            className="hidden md:flex items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-slate-800 px-2 py-1 transition-colors"
          >
            {collapsed ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-xs text-slate-300 hover:text-white px-2 py-1"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-auto space-y-3">
          {visibleMenuGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && <div className="px-2 text-[11px] uppercase tracking-wide text-slate-500">{group.title}</div>}
              {group.links.map((l: MenuLink) => {
                const Icon = l.icon;
                return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    pathname === l.href || pathname.startsWith(l.href + "/")
                      ? "bg-emerald-600 text-slate-950 font-medium shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title={l.label}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${collapsed ? "mx-auto" : ""}`} />
                  {!collapsed && <span className="truncate">{l.label}</span>}
                </Link>
                );
              })}
            </div>
          ))}
        </nav>

      </aside>
      <main className="flex-1 min-w-0 md:ml-0 h-screen overflow-y-auto transition-all duration-300 ease-out">
        <div className="sticky top-0 z-30 flex justify-end px-4 md:px-6 py-3 bg-slate-950/75 backdrop-blur border-b border-slate-800">
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-800 inline-flex items-center gap-2"
              title={userInfo.name}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-slate-950 text-xs font-semibold">
                {avatarLabel}
              </span>
              {userInfo.name}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-lg">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="text-sm font-medium text-slate-100">{userInfo.name}</div>
                  <div className="text-xs text-slate-400">{userInfo.email || "Không có email"}</div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full mt-2 rounded-md px-3 py-2 text-left text-sm text-red-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <FiLogOut className="h-4 w-4 shrink-0" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
