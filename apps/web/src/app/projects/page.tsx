"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiBase, getUserRole } from "@/lib/api";
import { MultiSelectSearch } from "@/components/MultiSelectSearch";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { FiEye, FiTrash2 } from "react-icons/fi";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string;
  members?: Array<{
    userId: string;
    user: { id: string; fullName: string; email: string; role: "ADMIN" | "TESTER" | "VIEWER" };
  }>;
  createdAt?: string;
  updatedAt?: string;
}
interface UserOption {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "TESTER" | "VIEWER";
}

const PROJECT_NAME_MAX_LENGTH = 255;
const PROJECT_DESCRIPTION_MAX_LENGTH = 2000;
const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

const roleLabels: Record<UserOption["role"], string> = {
  ADMIN: "Quản trị",
  TESTER: "Kiểm thử",
  VIEWER: "Xem",
};

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
  const [users, setUsers] = useState<UserOption[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);
  const apiBase = getApiBase();

  useEffect(() => {
    queueMicrotask(() => {
      setRole(getUserRole());
      try {
        const raw = localStorage.getItem("authUser");
        if (!raw) return;
        const user = JSON.parse(raw) as { fullName?: string; email?: string };
        setCurrentUserName(user.fullName || user.email || "—");
      } catch {
        setCurrentUserName("—");
      }
    });
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
      if (getUserRole() === "ADMIN") {
        const uRes = await axios.get<UserOption[]>(`${apiBase}/auth/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(uRes.data.filter((u) => u.role !== "ADMIN"));
      } else {
        setUsers([]);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải được danh sách project");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
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

  const canCreateOrEditProject = role === "ADMIN";
  const canAssignMembers = role === "ADMIN";

  const memberSelectOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.fullName,
        description: `${u.email} · ${roleLabels[u.role]}`,
      })),
    [users],
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateOrEditProject) {
      setError("Bạn không có quyền tạo project.");
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
        {
          name: normalizedName,
          description: normalizedDescription || undefined,
          ...(canAssignMembers && memberIds.length > 0 ? { memberIds } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName("");
      setDescription("");
      setMemberIds([]);
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
    setEditMemberIds(project.members?.map((m) => m.userId) ?? []);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateOrEditProject) {
      setError("Bạn không có quyền chỉnh sửa project.");
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
        {
          name: editName,
          description: editDesc || undefined,
          ...(canAssignMembers ? { memberIds: editMemberIds } : {}),
        },
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
    <main className={ui.content}>
      <div className={ui.wide}>
        <PageHeader
          title="Quản lý project"
          subtitle={`Chỉ Admin: tạo / sửa / xóa dự án và gán thành viên. Tester không quản lý dự án trên hệ thống (chỉ làm việc trên dự án được gán). Quyền hiện tại: ${role ?? "—"}.`}
          actions={
            canCreateOrEditProject ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  setShowCreateForm(true);
                }}
                className={ui.btnPrimary}
              >
                Tạo project
              </button>
            ) : undefined
          }
        />

      <section className={`${ui.card} mb-2`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className={ui.sectionTitle}>Danh sách</p>
          <input
            className={`w-full md:max-w-sm ${ui.input}`}
            value={search}
            onChange={(e) => setSearch(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
            maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
            placeholder="Tìm theo tên hoặc mô tả project..."
          />
        </div>
      </section>

      {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
      {error && <p className={`${ui.alertError} mb-4`}>{error}</p>}
      {success && <p className={`${ui.alertOk} mb-4`}>{success}</p>}

      <section className={ui.tableWrap}>
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>STT</th>
              <th className={ui.th}>Tên project</th>
              <th className={ui.th}>Mô tả</th>
              <th className={ui.th}>Ngày tạo</th>
              <th className={ui.th}>Ngày cập nhật</th>
              <th className={ui.th}>Người tạo</th>
              <th className={ui.th}>Thành viên</th>
              <th className={ui.th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, index) => (
              <tr key={project.id} className={ui.tr}>
                <td className={ui.td}>{index + 1}</td>
                <td className={`${ui.td} font-medium text-white`}>{project.name}</td>
                <td className={`${ui.td} text-slate-300`}>{project.description ?? "—"}</td>
                <td className={`${ui.td} text-slate-400`}>
                  {project.createdAt ? new Date(project.createdAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td className={`${ui.td} text-slate-400`}>
                  {project.updatedAt ? new Date(project.updatedAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td className={`${ui.td} text-slate-400`}>
                  {(project.members ?? []).length > 0
                    ? project.members!.map((m) => m.user.fullName || m.user.email).join(", ")
                    : "—"}
                </td>
                <td className={`${ui.td} text-slate-400`}>{currentUserName}</td>
                <td className={ui.td}>
                  <div className="flex flex-wrap gap-2">
                    {canCreateOrEditProject && (
                      <button
                        type="button"
                        onClick={() => startEdit(project)}
                        className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700`}
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
        <div className={ui.modalOverlay}>
          <div className={ui.modalBoxMd}>
            <h3 className="text-lg font-semibold text-white">Sửa project</h3>
            <form onSubmit={saveEdit} className="space-y-3">
              <div>
                <label className={ui.label}>Tên</label>
                <input
                  className={ui.input}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, PROJECT_NAME_MAX_LENGTH))}
                  maxLength={PROJECT_NAME_MAX_LENGTH}
                  required
                />
              </div>
              <div>
                <label className={ui.label}>Mô tả</label>
                <textarea
                  className={ui.textarea}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value.slice(0, PROJECT_DESCRIPTION_MAX_LENGTH))}
                  maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                  rows={4}
                />
              </div>
              {canAssignMembers && (
                <div>
                  <label className={ui.label} htmlFor="edit-project-members">
                    Gán Tester/Viewer
                  </label>
                  <MultiSelectSearch
                    id="edit-project-members"
                    options={memberSelectOptions}
                    value={editMemberIds}
                    onChange={setEditMemberIds}
                    searchPlaceholder="Tìm theo tên, email hoặc vai trò…"
                    emptyMessage="Không tìm thấy Tester/Viewer phù hợp."
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditing(null)} className={ui.btnSecondary}>
                  Hủy
                </button>
                <button type="submit" disabled={saving} className={ui.btnPrimary}>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className={ui.modalOverlay}>
          <div className={ui.modalBox}>
            <h3 className="text-lg font-semibold text-white">Tạo project mới</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className={ui.label}>Tên project</label>
                <input
                  className={ui.input}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, PROJECT_NAME_MAX_LENGTH))}
                  maxLength={PROJECT_NAME_MAX_LENGTH}
                  required
                  placeholder="Ví dụ: Web bán hàng"
                />
              </div>
              <div>
                <label className={ui.label}>Mô tả</label>
                <textarea
                  className={ui.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, PROJECT_DESCRIPTION_MAX_LENGTH))}
                  maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
                  placeholder="Mô tả ngắn"
                  rows={4}
                />
              </div>
              {canAssignMembers && (
                <div>
                  <label className={ui.label} htmlFor="create-project-members">
                    Gán Tester/Viewer
                  </label>
                  <MultiSelectSearch
                    id="create-project-members"
                    options={memberSelectOptions}
                    value={memberIds}
                    onChange={setMemberIds}
                    searchPlaceholder="Tìm theo tên, email hoặc vai trò…"
                    emptyMessage="Không tìm thấy Tester/Viewer phù hợp."
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className={ui.btnSecondary}>
                  Hủy
                </button>
                <button type="submit" disabled={saving} className={ui.btnPrimary}>
                  {saving ? "Đang lưu…" : "Tạo project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projectToDelete && (
        <div className={ui.modalOverlay}>
          <div className={ui.modalBoxMd}>
            <h3 className="text-lg font-semibold text-white">Xác nhận xóa project</h3>
            <p className="text-sm text-slate-300">
              Bạn có chắc muốn xóa project <span className="font-medium text-slate-100">{projectToDelete.name}</span>?
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Các dữ liệu liên quan có thể bị ảnh hưởng tùy ràng buộc trong database.
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => setProjectToDelete(null)} className={ui.btnSecondary}>
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = projectToDelete.id;
                  setProjectToDelete(null);
                  await removeProject(id);
                }}
                className={ui.btnDanger}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
