"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/api";

interface Project {
  id: string;
  name: string;
}

interface DataSet {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  rows: Record<string, unknown>[];
}

const ROWS_DEFAULT = `[
  { "email": "user@example.com", "password": "Secret123" }
]`;

function DatasetsPageInner() {
  const searchParams = useSearchParams();
  const qp = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [datasets, setDatasets] = useState<DataSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rowsJson, setRowsJson] = useState(ROWS_DEFAULT);

  const apiBase = getApiBase();

  const loadProjects = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const res = await axios.get<Project[]>(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjects(res.data);
  }, [apiBase]);

  const loadDatasets = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !projectId) {
      setDatasets([]);
      return;
    }
    const res = await axios.get<DataSet[]>(`${apiBase}/datasets?projectId=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDatasets(res.data);
  }, [apiBase, projectId]);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      try {
        await loadProjects();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Lỗi tải project");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) return;
    setProjectId((prev) => {
      if (qp && projects.some((p) => p.id === qp)) return qp;
      if (prev && projects.some((p) => p.id === prev)) return prev;
      return projects[0].id;
    });
  }, [projects, qp]);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setError(null);
      try {
        await loadDatasets();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Lỗi tải dataset");
      }
    })();
  }, [projectId, loadDatasets]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token || !projectId) return;
    setError(null);
    setMsg(null);
    let rows: Record<string, unknown>[];
    try {
      const parsed = JSON.parse(rowsJson);
      if (!Array.isArray(parsed)) throw new Error("rows phải là mảng");
      rows = parsed as Record<string, unknown>[];
    } catch (e: unknown) {
      setError("JSON rows không hợp lệ: " + String(e));
      return;
    }
    try {
      await axios.post(
        `${apiBase}/datasets`,
        { projectId, name, description: description || undefined, rows },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName("");
      setDescription("");
      setRowsJson(ROWS_DEFAULT);
      setMsg("Đã tạo bộ dữ liệu.");
      await loadDatasets();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tạo được");
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa bộ dữ liệu này?")) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setError(null);
    try {
      await axios.delete(`${apiBase}/datasets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadDatasets();
      setMsg("Đã xóa.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không xóa được");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Bộ dữ liệu (data-driven)</h1>
      <p className="text-sm text-slate-300 mb-6">
        Mỗi phần tử trong <code className="text-emerald-400">rows</code> là một lần lặp khi chạy kịch bản (kết hợp keyword{" "}
        <code className="text-emerald-400">fill</code> / <code className="text-emerald-400">assertText</code> với{" "}
        <code className="text-emerald-400">dataKey</code>).
      </p>

      {loading && <p className="text-sm text-slate-400">Đang tải...</p>}
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
      {msg && <p className="text-sm text-emerald-400 mb-2">{msg}</p>}

      <div className="mb-6">
        <label className="text-xs text-slate-400">Project</label>
        <select
          className="mt-1 block rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 mb-8 space-y-3"
      >
        <h2 className="text-sm font-medium">Tạo bộ dữ liệu</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400">Tên</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Mô tả</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">rows (JSON array)</label>
          <textarea
            className="mt-1 w-full min-h-[120px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono"
            value={rowsJson}
            onChange={(e) => setRowsJson(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950"
        >
          Tạo
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-medium mb-2">Danh sách</h2>
        {datasets.map((d) => (
          <div
            key={d.id}
            className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"
          >
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-slate-500">{d.description}</div>
              </div>
              <button
                type="button"
                onClick={() => remove(d.id)}
                className="text-xs text-red-400 shrink-0"
              >
                Xóa
              </button>
            </div>
            <pre className="mt-2 text-[10px] text-slate-400 overflow-auto max-h-24">
              {JSON.stringify(d.rows, null, 2)}
            </pre>
          </div>
        ))}
        {datasets.length === 0 && !loading && projectId && (
          <p className="text-xs text-slate-500">Chưa có bộ dữ liệu.</p>
        )}
      </section>
    </main>
  );
}

export default function DatasetsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải...</main>}>
      <DatasetsPageInner />
    </Suspense>
  );
}
