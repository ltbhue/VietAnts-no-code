"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiBase, getUserRole } from "@/lib/api";
import { FiEye, FiTrash2 } from "react-icons/fi";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PROJECT_NAME_MAX_LENGTH = 255;
const PROJECT_DESCRIPTION_MAX_LENGTH = 2000;
const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [role, setRole] = useState<ReturnType<typeof getUserRole>>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("—");
  const apiBase = getApiBase();

  useEffect(() => {
    setRole(getUserRole());
    try {
      const raw = localStorage.getItem("authUser");
      if (!raw) return;
      const user = JSON.parse(raw) as { fullName?: string; email?: string };
      setCurrentUserName(user.fullName || user.email || "—");
    } catch {
      setCurrentUserName("—");
    }
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

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(keyword) ||
        (project.description ?? "").toLowerCase().includes(keyword),
    );
  }, [projects, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (role === "VIEWER") {
      setError("Bạn đang ở quyền Viewer nên không thể tạo project.");
      return;
    }
    const normalizedName = name.trim().slice(0, PROJECT_NAME_MAX_LENGTH);
    const normalizedDescription = description.slice(0, PROJECT_DESCRIPTION_MAX_LENGTH);
    if (!normalizedName) {
      setError("Tên project là bắt buộc.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(
        `${apiBase}/projects`,
        { name: normalizedName, description: normalizedDescription || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName("");
      setDescription("");
      setShowCreateForm(false);
      setSuccess("Tạo project thành công.");
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tạo được project");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(project: Project) {
    setEditing(project);
    setEditName(project.name);
    setEditDesc(project.description ?? "");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (role === "VIEWER") {
      setError("Bạn đang ở quyền Viewer nên không thể chỉnh sửa project.");
      return;
    }
    if (!editing) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.put(
        `${apiBase}/projects/${editing.id}`,
        { name: editName, description: editDesc || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditing(null);
      setSuccess("Cập nhật project thành công.");
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không cập nhật được project");
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(id: string) {
    if (role !== "ADMIN") {
      setError("Bạn không có quyền xóa project.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setError(null);
    setSuccess(null);
    try {
      await axios.delete(`${apiBase}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Xóa thành công");
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Chỉ ADMIN mới xóa được project hoặc có lỗi server");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Quản lý project</h1>
            <p className="text-sm text-slate-300 mt-1">Tạo, cập nhật, xóa project và tìm kiếm nhanh trong danh sách.</p>
            <p className="text-xs text-slate-400 mt-2">
              Quyền hiện tại: <span className="text-slate-200 font-medium">{role ?? "Chưa xác định"}</span>
            </p>
          </div>
          {role !== "VIEWER" && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccess(null);
                setShowCreateForm(true);
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500"
            >
              Tạo project
            </button>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-sm font-medium text-slate-200">Danh sách project</h2>
          <input
            className="w-full md:w-80 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
            maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
            placeholder="Tìm theo tên hoặc mô tả project..."
          />
        </div>
      </section>

      {loading && <p className="text-sm text-slate-300">Đang tải...</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {success && <p className="text-sm text-emerald-400 mb-4">{success}</p>}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">STT</th>
              <th className="px-4 py-3 text-left">Tên project</th>
              <th className="px-4 py-3 text-left">Mô tả</th>
              <th className="px-4 py-3 text-left">Ngày tạo</th>
              <th className="px-4 py-3 text-left">Ngày cập nhật</th>
              <th className="px-4 py-3 text-left">Người tạo</th>
              <th className="px-4 py-3 text-left">Người cập nhật</th>
              <th className="px-4 py-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, index) => (
              <tr key={project.id} className="border-t border-slate-800 text-slate-200 align-top">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{project.name}</td>
                <td className="px-4 py-3 text-slate-300">{project.description ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">
                  {project.createdAt ? new Date(project.createdAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {project.updatedAt ? new Date(project.updatedAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3 text-slate-300">{currentUserName}</td>
                <td className="px-4 py-3 text-slate-300">{currentUserName}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {role !== "VIEWER" && (
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        className="rounded-md bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    {role === "ADMIN" && (
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(project)}
                        className="inline-flex items-center justify-center rounded-md bg-red-900/40 p-1.5 text-red-300 hover:bg-red-900/70"
                        aria-label={`Xóa project ${project.name}`}
                        title="Xóa project"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                    <Link
                      href={`/scripts?projectId=${project.id}`}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-900/40 p-1.5 text-emerald-300 hover:bg-emerald-900/70"
                      aria-label={`Xem project ${project.name}`}
                      title="Xem project"
                    >
                      <FiEye className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {filteredProjects.length === 0 && !loading && !error && (
        <p className="text-sm text-slate-300 mt-4">
          {projects.length === 0 ? "Chưa có project. Tạo project phía trên." : "Không có project khớp từ khóa tìm kiếm."}
        </p>
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
                  onChange={(e) => setEditName(e.target.value.slice(0, PROJECT_NAME_MAX_LENGTH))}
                  maxLength={PROJECT_NAME_MAX_LENGTH}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mô tả</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value.slice(0, PROJECT_DESCRIPTION_MAX_LENGTH))}
                  maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                  rows={4}
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

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-xl w-full shadow-xl">
            <h3 className="font-medium mb-3">Tạo project mới</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Tên project</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, PROJECT_NAME_MAX_LENGTH))}
                  maxLength={PROJECT_NAME_MAX_LENGTH}
                  required
                  placeholder="Ví dụ: Web bán hàng"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Mô tả</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, PROJECT_DESCRIPTION_MAX_LENGTH))}
                  maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                  placeholder="Mô tả ngắn"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 text-sm rounded-md bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-slate-950 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Tạo project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projectToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-medium mb-2">Xác nhận xóa project</h3>
            <p className="text-sm text-slate-300">
              Bạn có chắc muốn xóa project <span className="font-medium text-slate-100">{projectToDelete.name}</span>?
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Các dữ liệu liên quan có thể bị ảnh hưởng tùy ràng buộc trong database.
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = projectToDelete.id;
                  setProjectToDelete(null);
                  await removeProject(id);
                }}
                className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-500"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
