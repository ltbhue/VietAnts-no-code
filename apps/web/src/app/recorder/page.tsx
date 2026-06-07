"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { canMutateNoCode, getApiBase, getUserRole } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { FiEdit2 } from "react-icons/fi";

interface Project {
  id: string;
  name: string;
}

interface TestCaseVersion {
  version: number;
  content: {
    lifecycle?: "Draft" | "Published";
    platform?: string;
    steps?: unknown[];
  };
}

interface TestCaseRow {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  updatedAt: string;
  lifecycle: "Draft" | "Published";
  stepCount: number;
  platform: string;
}

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;
const ALL_PROJECTS = "__all__";

function lifecycleBadge(lifecycle: TestCaseRow["lifecycle"]) {
  if (lifecycle === "Published") {
    return (
      <span className="inline-flex rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-300">
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-200">
      Draft
    </span>
  );
}

function RecorderListPageInner() {
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<TestCaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Draft" | "Published">("all");
  const [selectedProjectId, setSelectedProjectId] = useState(ALL_PROJECTS);

  const apiBase = getApiBase();
  const canMutate = canMutateNoCode(getUserRole());

  const loadProjects = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const res = await axios.get<Project[]>(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjects(res.data);
  }, [apiBase]);

  useEffect(() => {
    if (projects.length === 0) return;
    queueMicrotask(() => {
      setSelectedProjectId((prev) => {
        if (projectIdFilter && projects.some((p) => p.id === projectIdFilter)) return projectIdFilter;
        if (prev !== ALL_PROJECTS && projects.some((p) => p.id === prev)) return prev;
        return ALL_PROJECTS;
      });
    });
  }, [projects, projectIdFilter]);

  const loadTestCases = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token || projects.length === 0) {
      setRows([]);
      return;
    }

    const targetProjects =
      selectedProjectId === ALL_PROJECTS
        ? projects
        : projects.filter((p) => p.id === selectedProjectId);

    const results = await Promise.all(
      targetProjects.map(async (project) => {
        const res = await axios.get<
          Array<{
            id: string;
            title: string;
            projectId: string;
            updatedAt: string;
            versions: TestCaseVersion[];
          }>
        >(`${apiBase}/projects/${project.id}/tests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.map((tc) => {
          const latest = tc.versions[0];
          const content = latest?.content ?? {};
          return {
            id: tc.id,
            title: tc.title,
            projectId: tc.projectId,
            projectName: project.name,
            updatedAt: tc.updatedAt,
            lifecycle: (content.lifecycle === "Published" ? "Published" : "Draft") as TestCaseRow["lifecycle"],
            stepCount: Array.isArray(content.steps) ? content.steps.length : 0,
            platform: content.platform ?? "desktop-web",
          };
        });
      }),
    );

    setRows(
      results
        .flat()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    );
  }, [apiBase, projects, selectedProjectId]);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadProjects();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải được danh sách dự án");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) return;
    (async () => {
      setError(null);
      try {
        await loadTestCases();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải được danh sách test case");
      }
    })();
  }, [projects, loadTestCases]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.lifecycle !== statusFilter) return false;
      if (!keyword) return true;
      return (
        row.title.toLowerCase().includes(keyword) ||
        row.projectName.toLowerCase().includes(keyword) ||
        row.id.toLowerCase().includes(keyword)
      );
    });
  }, [rows, search, statusFilter]);

  const draftCount = rows.filter((r) => r.lifecycle === "Draft").length;
  const publishedCount = rows.filter((r) => r.lifecycle === "Published").length;

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || selectedProjectId !== ALL_PROJECTS;

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setSelectedProjectId(ALL_PROJECTS);
  }

  return (
    <main className={ui.content}>
      <div className={ui.wide}>
        <PageHeader
          title="Ghi thao tác"
          subtitle="Danh sách test case tạo từ ghi thủ công, import Playwright hoặc smart record — rà soát Draft rồi publish tại Biên tập."
          actions={
            canMutate ? (
              <Link href="/recorder/new" className={ui.btnPrimary}>
                + Ghi thao tác mới
              </Link>
            ) : undefined
          }
        />

        {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
        {error && <p className={`${ui.alertError} mb-3`}>{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className={ui.statCard}>
            <div className="text-xs text-slate-500">Tổng test case</div>
            <div className="text-2xl font-semibold text-white mt-1">{rows.length}</div>
          </div>
          <div className={ui.statCard}>
            <div className="text-xs text-slate-500">Draft</div>
            <div className="text-2xl font-semibold text-amber-200 mt-1">{draftCount}</div>
          </div>
          <div className={ui.statCard}>
            <div className="text-xs text-slate-500">Published</div>
            <div className="text-2xl font-semibold text-emerald-300 mt-1">{publishedCount}</div>
          </div>
        </div>

        <section className={ui.card}>
          <p className={`${ui.sectionTitle} mb-4`}>Danh sách</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 items-end">
            <div>
              <label className={ui.label}>Dự án</label>
              <select
                className={ui.select}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value={ALL_PROJECTS}>Tất cả dự án</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={ui.label}>Trạng thái</label>
              <select
                className={ui.select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">Tất cả</option>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div>
              <label className={ui.label}>Tìm kiếm</label>
              <input
                className={ui.input}
                value={search}
                onChange={(e) => setSearch(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="Tên test case, dự án hoặc ID…"
              />
            </div>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`${ui.btnSecondary} w-full disabled:opacity-40 disabled:pointer-events-none`}
            >
              Đặt lại
            </button>
          </div>

          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>STT</th>
                  <th className={ui.th}>Tên test case</th>
                  <th className={ui.th}>Dự án</th>
                  <th className={ui.th}>Trạng thái</th>
                  <th className={ui.th}>Số bước</th>
                  <th className={ui.th}>Nền tảng</th>
                  <th className={ui.th}>Cập nhật</th>
                  <th className={ui.th}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={row.id} className={ui.tr}>
                    <td className={`${ui.td} text-slate-400`}>{idx + 1}</td>
                    <td className={ui.td}>
                      <div className="font-medium text-emerald-400">{row.title}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{row.id}</div>
                    </td>
                    <td className={`${ui.td} text-slate-300`}>{row.projectName}</td>
                    <td className={ui.td}>{lifecycleBadge(row.lifecycle)}</td>
                    <td className={`${ui.td} text-slate-300`}>{row.stepCount}</td>
                    <td className={`${ui.td} text-slate-400`}>{row.platform}</td>
                    <td className={`${ui.td} text-slate-400 whitespace-nowrap`}>
                      {new Date(row.updatedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className={ui.td}>
                      <div className="flex flex-wrap gap-2">
                        {row.lifecycle === "Draft" && canMutate && (
                          <Link
                            href={`/recorder/edit?projectId=${encodeURIComponent(row.projectId)}&testCaseId=${encodeURIComponent(row.id)}`}
                            className={`${ui.btnSm} inline-flex items-center gap-1 bg-slate-800 text-slate-200 hover:bg-slate-700`}
                          >
                            <FiEdit2 className="h-3.5 w-3.5" aria-hidden />
                            Chỉnh sửa
                          </Link>
                        )}
                        {row.lifecycle === "Draft" && canMutate && (
                          <Link
                            href={`/editor?projectId=${encodeURIComponent(row.projectId)}&testCaseId=${encodeURIComponent(row.id)}`}
                            className={`${ui.btnSm} bg-indigo-900/50 text-indigo-200 hover:bg-indigo-900/80`}
                          >
                            Publish
                          </Link>
                        )}
                        {canMutate && (
                          <Link href="/recorder/new" className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700`}>
                            Ghi mới
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && !loading && (
            <p className="text-xs text-slate-400 mt-4">
              {rows.length === 0
                ? "Chưa có test case nào. Bấm «Ghi thao tác mới» để tạo từ thao tác thực tế."
                : "Không có test case khớp bộ lọc."}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function RecorderPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải…</main>}>
      <RecorderListPageInner />
    </Suspense>
  );
}
