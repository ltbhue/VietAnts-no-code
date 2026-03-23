"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiBase, getUserRole } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  description?: string | null;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const apiBase = getApiBase();
  const [role, setRole] = useState<ReturnType<typeof getUserRole>>(null);

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  const load = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setError(null);
    try {
      const res = await axios.get<Project[]>(`${apiBase}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải được danh sách project");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(
        `${apiBase}/projects`,
        { name, description: description || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName("");
      setDescription("");
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tạo được project");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: Project) {
    setEditing(p);
    setEditName(p.name);
    setEditDesc(p.description ?? "");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await axios.put(
        `${apiBase}/projects/${editing.id}`,
        { name: editName, description: editDesc || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditing(null);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không cập nhật được");
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id: string) {
    if (!confirm("Xóa project này? Các kịch bản liên quan có thể bị ảnh hưởng (tuỳ ràng buộc DB).")) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setError(null);
    try {
      await axios.delete(`${apiBase}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Chỉ ADMIN mới xóa được project hoặc có lỗi server");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-300 mt-1">
          Quản lý project, sau đó tạo kịch bản, đối tượng UI và bộ dữ liệu.
        </p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 mb-8">
        <h2 className="text-sm font-medium text-slate-200 mb-3">Tạo project mới</h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1 space-y-2">
            <label className="block text-xs text-slate-400">Tên</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ví dụ: Web bán hàng"
            />
          </div>
          <div className="flex-[2] space-y-2">
            <label className="block text-xs text-slate-400">Mô tả (tuỳ chọn)</label>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Tạo project"}
          </button>
        </form>
      </section>

      {loading && <p className="text-sm text-slate-300">Đang tải...</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
            <h2 className="font-medium mb-1">{p.name}</h2>
            <p className="text-xs text-slate-300 mb-4 flex-1">{p.description ?? "—"}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                href={`/scripts?projectId=${p.id}`}
                className="text-emerald-400 hover:underline"
              >
                Kịch bản
              </Link>
              <span className="text-slate-600">|</span>
              <Link href={`/objects?projectId=${p.id}`} className="text-emerald-400 hover:underline">
                Đối tượng
              </Link>
              <span className="text-slate-600">|</span>
              <Link href={`/datasets?projectId=${p.id}`} className="text-emerald-400 hover:underline">
                Dữ liệu
              </Link>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="rounded-md bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
              >
                Sửa
              </button>
              {role === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => removeProject(p.id)}
                  className="rounded-md bg-red-900/50 px-2 py-1 text-xs text-red-300 hover:bg-red-900"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {projects.length === 0 && !loading && !error && (
        <p className="text-sm text-slate-300 mt-4">Chưa có project. Tạo project phía trên.</p>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-medium mb-3">Sửa project</h3>
            <form onSubmit={saveEdit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Tên</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mô tả</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5 text-sm rounded-md bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-slate-950"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
