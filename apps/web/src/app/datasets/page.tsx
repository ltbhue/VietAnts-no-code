"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { canMutateNoCode, getApiBase, getUserRole } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";

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
const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

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
  const canMutate = canMutateNoCode(getUserRole());

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
    queueMicrotask(() => {
      setProjectId((prev) => {
        if (qp && projects.some((p) => p.id === qp)) return qp;
        if (prev && projects.some((p) => p.id === prev)) return prev;
        return projects[0].id;
      });
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
    <main className={ui.content}>
      <div className={ui.narrow}>
        <PageHeader
          title="Bộ dữ liệu"
          subtitle="Mỗi phần tử trong rows là một lần lặp khi chạy kịch bản (dùng với fill / assertText và dataKey)."
        />

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
      {error && <p className={`${ui.alertError} mb-3`}>{error}</p>}
      {msg && <p className={`${ui.alertOk} mb-3`}>{msg}</p>}

      <div className={`${ui.cardCompact} mb-6`}>
        <label className={ui.label}>Project</label>
        <select
          className={ui.select}
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

      {canMutate && (
        <form onSubmit={handleCreate} className={`${ui.card} mb-8 space-y-4`}>
          <p className={ui.sectionTitle}>Tạo bộ dữ liệu mới</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={ui.label}>Tên</label>
            <input
              className={ui.input}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              required
            />
          </div>
          <div>
            <label className={ui.label}>Mô tả</label>
            <textarea
              className={ui.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              rows={4}
            />
          </div>
        </div>
        <div>
          <label className={ui.label}>rows (JSON array)</label>
          <textarea
            className={`${ui.textarea} min-h-[140px] font-mono text-xs`}
            value={rowsJson}
            onChange={(e) => setRowsJson(e.target.value)}
          />
        </div>
          <button type="submit" className={ui.btnPrimary}>
            Tạo bộ dữ liệu
          </button>
        </form>
      )}

      <section className="space-y-3">
        <p className={ui.sectionTitle}>Danh sách trong project</p>
        {datasets.map((d) => (
          <div
            key={d.id}
            className={`${ui.cardCompact} text-sm`}
          >
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-slate-500">{d.description}</div>
              </div>
              {canMutate ? (
                <button type="button" onClick={() => remove(d.id)} className={`${ui.btnSm} text-red-400 hover:bg-red-950/40`}>
                  Xóa
                </button>
              ) : (
                <span className="text-xs text-slate-500">Chỉ xem</span>
              )}
            </div>
            <pre className={`${ui.pre} mt-2 text-[10px] max-h-28`}>
              {JSON.stringify(d.rows, null, 2)}
            </pre>
          </div>
        ))}
        {datasets.length === 0 && !loading && projectId && (
          <p className="text-xs text-slate-500">Chưa có bộ dữ liệu.</p>
        )}
      </section>
      </div>
    </main>
  );
}

export default function DatasetsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải…</main>}>
      <DatasetsPageInner />
    </Suspense>
  );
}
