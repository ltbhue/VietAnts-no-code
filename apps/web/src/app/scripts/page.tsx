"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { canMutateNoCode, getApiBase, getUserRole } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";

interface Project {
  id: string;
  name: string;
}

interface Script {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  project?: Project;
}

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

function ScriptsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [scriptSearch, setScriptSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProjectId, setNewProjectId] = useState("");

  const apiBase = getApiBase();
  const canMutate = canMutateNoCode(getUserRole());

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const filteredScripts = scripts.filter((s) => {
    const q = scriptSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q) ||
      (s.project?.name ?? s.projectId).toLowerCase().includes(q)
    );
  });

  const loadProjects = useCallback(async () => {
    if (!token) return;
    const res = await axios.get<Project[]>(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjects(res.data);
  }, [apiBase, token]);

  useEffect(() => {
    if (projects.length === 0) return;
    queueMicrotask(() => {
      setNewProjectId((prev) => {
        if (prev && projects.some((p) => p.id === prev)) return prev;
        if (projectIdFilter && projects.some((p) => p.id === projectIdFilter)) return projectIdFilter;
        return projects[0].id;
      });
    });
  }, [projects, projectIdFilter]);

  const loadScripts = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams();
    if (projectIdFilter) params.set("projectId", projectIdFilter);
    const res = await axios.get<Script[]>(`${apiBase}/scripts${params.toString() ? `?${params.toString()}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setScripts(res.data);
  }, [apiBase, token, projectIdFilter]);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadProjects(), loadScripts()]);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProjects, loadScripts]);

  async function createScript(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newProjectId) return;
    setError(null);
    try {
      const res = await axios.post<{ id: string }>(
        `${apiBase}/scripts`,
        { name: newName, description: newDesc || undefined, projectId: newProjectId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      await loadScripts();
      setMsg("Đã tạo kịch bản.");
      router.push(`/scripts/${res.data.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tạo được");
    }
  }

  async function deleteScript(id: string) {
    if (!confirm("Xóa kịch bản này?")) return;
    if (!token) return;
    setError(null);
    try {
      await axios.delete(`${apiBase}/scripts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadScripts();
      setMsg("Đã xóa.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không xóa được");
    }
  }

  return (
    <main className={ui.content}>
      <div className={ui.wide}>
        <PageHeader
          title="Kịch bản kiểm thử"
          subtitle="Từ khóa: navigate, click, fill, assertText — mở từng kịch bản để thêm bước và chạy thử."
          actions={
            canMutate ? (
              <button type="button" onClick={() => setShowCreate(true)} className={ui.btnPrimary}>
                + Tạo kịch bản
              </button>
            ) : undefined
          }
        />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
      {error && <p className={`${ui.alertError} mb-3`}>{error}</p>}
      {msg && <p className={`${ui.alertOk} mb-3`}>{msg}</p>}

      <section className={ui.card}>
        <p className={`${ui.sectionTitle} mb-4`}>Danh sách</p>
        <input
          className={`mb-4 ${ui.input}`}
          value={scriptSearch}
          onChange={(e) => setScriptSearch(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
          maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
          placeholder="Tìm theo tên, mô tả hoặc project..."
        />
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>STT</th>
                <th className={ui.th}>Tên kịch bản</th>
                <th className={ui.th}>Project</th>
                <th className={ui.th}>Mô tả</th>
                <th className={ui.th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredScripts.map((s, idx) => (
                <tr key={s.id} className={ui.tr}>
                  <td className={`${ui.td} text-slate-400`}>{idx + 1}</td>
                  <td className={ui.td}>
                    <Link href={`/scripts/${s.id}`} className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.project?.name ?? s.projectId}</td>
                  <td className="px-3 py-2 text-slate-400">{s.description || "—"}</td>
                  <td className="px-3 py-2">
                    {canMutate ? (
                      <button
                        type="button"
                        onClick={() => deleteScript(s.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Xóa
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Chỉ xem</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {scripts.length === 0 && !loading && (
          <p className="text-xs text-slate-400">Chưa có kịch bản. Tạo mới hoặc đổi project.</p>
        )}
      </section>

      {showCreate && canMutate && (
        <div
          className={ui.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-script-title"
        >
          <form
            onSubmit={createScript}
            className={`${ui.modalBoxMd} space-y-4`}
          >
            <div>
              <h3 id="create-script-title" className="text-lg font-semibold text-white">
                Tạo kịch bản mới
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sau khi tạo, bạn sẽ thêm từng bước (mở trang, điền form, bấm nút…) trên trang chi tiết kịch bản.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Thuộc project</label>
              <select
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Tên kịch bản</label>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="Ví dụ: Đăng nhập admin thành công"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300">Mô tả (tuỳ chọn)</label>
              <textarea
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40 resize-y min-h-[88px]"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                rows={4}
                placeholder="Ghi chú ngắn cho team QA…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-500"
              >
                Tạo và mở chỉnh sửa
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
    </main>
  );
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải...</main>}>
      <ScriptsPageInner />
    </Suspense>
  );
}
