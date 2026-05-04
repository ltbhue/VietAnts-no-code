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

interface UiObject {
  id: string;
  name: string;
  description?: string | null;
  locator: string;
  projectId: string;
}

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

function ObjectsPageInner() {
  const searchParams = useSearchParams();
  const qp = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [objects, setObjects] = useState<UiObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locator, setLocator] = useState("");

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

  const loadObjects = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token || !projectId) {
      setObjects([]);
      return;
    }
    const res = await axios.get<UiObject[]>(`${apiBase}/objects?projectId=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setObjects(res.data);
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
        await loadObjects();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Lỗi tải đối tượng");
      }
    })();
  }, [projectId, loadObjects]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token || !projectId) return;
    setError(null);
    setMsg(null);
    try {
      await axios.post(
        `${apiBase}/objects`,
        { projectId, name, description: description || undefined, locator },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName("");
      setDescription("");
      setLocator("");
      setMsg("Đã thêm đối tượng.");
      await loadObjects();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tạo được");
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa đối tượng này?")) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setError(null);
    try {
      await axios.delete(`${apiBase}/objects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadObjects();
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
          title="Đối tượng UI"
          subtitle="Lưu locator có tên — dùng trong kịch bản qua targetId (cuid của đối tượng)."
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
          <p className={ui.sectionTitle}>Thêm đối tượng</p>
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
            <label className={ui.label}>Locator (CSS / text Playwright)</label>
            <input
              className={`${ui.input} font-mono text-xs`}
              value={locator}
              onChange={(e) => setLocator(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              required
              placeholder="#login-button"
            />
          </div>
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
          <button type="submit" className={ui.btnPrimary}>
            Thêm đối tượng
          </button>
        </form>
      )}

      <section className="space-y-3">
        <p className={ui.sectionTitle}>Danh sách</p>
        {objects.map((o) => (
          <div
            key={o.id}
            className={`flex flex-wrap items-start justify-between gap-2 ${ui.cardCompact} text-sm`}
          >
            <div>
              <div className="font-semibold text-white">{o.name}</div>
              <div className="text-xs text-slate-400 font-mono">{o.locator}</div>
              <div className="text-[10px] text-slate-500 mt-1">id: {o.id}</div>
            </div>
            {canMutate ? (
              <button
                type="button"
                onClick={() => remove(o.id)}
                className="text-xs text-red-400 hover:underline"
              >
                Xóa
              </button>
            ) : (
              <span className="text-xs text-slate-500">Chỉ xem</span>
            )}
          </div>
        ))}
        {objects.length === 0 && !loading && projectId && (
          <p className="text-xs text-slate-500">Chưa có đối tượng.</p>
        )}
      </section>
      </div>
    </main>
  );
}

export default function ObjectsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải...</main>}>
      <ObjectsPageInner />
    </Suspense>
  );
}
