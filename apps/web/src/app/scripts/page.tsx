"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/api";

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
    setNewProjectId((prev) => {
      if (prev && projects.some((p) => p.id === prev)) return prev;
      if (projectIdFilter && projects.some((p) => p.id === projectIdFilter)) return projectIdFilter;
      return projects[0].id;
    });
  }, [projects, projectIdFilter]);

  const loadScripts = useCallback(async () => {
    if (!token) return;
    const res = await axios.get<Script[]>(`${apiBase}/scripts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = res.data;
    const filtered = projectIdFilter
      ? all.filter((s) => s.projectId === projectIdFilter)
      : all;
    setScripts(filtered);
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
        await loadProjects();
        await loadScripts();
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
      await axios.post(
        `${apiBase}/scripts`,
        { name: newName, description: newDesc || undefined, projectId: newProjectId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      await loadScripts();
      setMsg("Đã tạo kịch bản.");
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
    <main className="min-h-screen p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Kịch bản kiểm thử</h1>
          <p className="text-sm text-slate-300 mt-1">
            Keywords: <code className="text-emerald-400">navigate</code>,{" "}
            <code className="text-emerald-400">click</code>, <code className="text-emerald-400">fill</code>,{" "}
            <code className="text-emerald-400">assertText</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500"
        >
          + Tạo kịch bản
        </button>
      </div>

      {loading && <p className="text-sm text-slate-300">Đang tải...</p>}
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
      {msg && <p className="text-sm text-emerald-400 mb-2">{msg}</p>}

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-medium mb-3">Danh sách</h2>
        <input
          className="mb-3 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={scriptSearch}
          onChange={(e) => setScriptSearch(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
          maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
          placeholder="Tìm theo tên, mô tả hoặc project..."
        />
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">STT</th>
                <th className="px-3 py-2 text-left">Tên kịch bản</th>
                <th className="px-3 py-2 text-left">Project</th>
                <th className="px-3 py-2 text-left">Mô tả</th>
                <th className="px-3 py-2 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredScripts.map((s, idx) => (
                <tr key={s.id} className="border-t border-slate-800">
                  <td className="px-3 py-2 text-slate-300">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <Link href={`/scripts/${s.id}`} className="text-left text-emerald-300 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{s.project?.name ?? s.projectId}</td>
                  <td className="px-3 py-2 text-slate-400">{s.description || "—"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => deleteScript(s.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Xóa
                    </button>
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

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <form
            onSubmit={createScript}
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-3"
          >
            <h3 className="font-medium">Tạo kịch bản</h3>
            <div>
              <label className="text-xs text-slate-400">Project</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
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
              <label className="text-xs text-slate-400">Tên</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Mô tả</label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800"
              >
                Hủy
              </button>
              <button type="submit" className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-slate-950">
                Tạo
              </button>
            </div>
          </form>
        </div>
      )}
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
