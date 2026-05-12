"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FiEdit2, FiRefreshCw, FiSearch, FiTrash2, FiUserPlus, FiX } from "react-icons/fi";
import { getApiBase, getUserRole } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "TESTER" | "VIEWER";
};

type ProjectOption = { id: string; name: string };

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

const roleLabels: Record<UserRow["role"], string> = {
  ADMIN: "Quản trị",
  TESTER: "Kiểm thử",
  VIEWER: "Xem",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const apiBase = getApiBase();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRow["role"]>("TESTER");
  const [assignProjectId, setAssignProjectId] = useState("");
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRow["role"]>("TESTER");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    if (getUserRole() !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        axios.get<UserRow[]>(`${apiBase}/auth/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Array<{ id: string; name: string }>>(`${apiBase}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setUsers(usersRes.data);
      setProjectOptions(projectsRes.data.map((p) => ({ id: p.id, name: p.name })));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string }; status?: number } };
      if (e?.response?.status === 403) {
        setError("Bạn không có quyền xem danh sách người dùng.");
        router.replace("/dashboard");
        return;
      }
      setError(e?.response?.data?.error ?? "Không tải được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [apiBase, router]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem("authUser");
        if (!raw) return;
        const u = JSON.parse(raw) as { id?: string };
        if (typeof u.id === "string") setCurrentUserId(u.id);
      } catch {
        setCurrentUserId(null);
      }
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        roleLabels[u.role].toLowerCase().includes(q),
    );
  }, [users, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = localStorage.getItem("authToken");
    if (!token || getUserRole() !== "ADMIN") return;

    const fn = fullName.trim().slice(0, DEFAULT_TEXTBOX_MAX_LENGTH);
    const em = email.trim().slice(0, DEFAULT_TEXTBOX_MAX_LENGTH);
    if (!fn || !em) {
      setError("Họ tên và email là bắt buộc.");
      return;
    }

    setCreating(true);
    try {
      const body: {
        fullName: string;
        email: string;
        password: string;
        role: UserRow["role"];
        projectId?: string;
      } = { fullName: fn, email: em, password, role: newRole };
      const pid = assignProjectId.trim();
      if (pid) body.projectId = pid;

      await axios.post(`${apiBase}/auth/admin/create-user`, body, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      setSuccess("Đã tạo người dùng.");
      setFullName("");
      setEmail("");
      setPassword("");
      setNewRole("TESTER");
      setAssignProjectId("");
      await load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Tạo người dùng thất bại");
      } else {
        setError("Tạo người dùng thất bại");
      }
    } finally {
      setCreating(false);
    }
  }

  function openEdit(u: UserRow) {
    setError(null);
    setSuccess(null);
    setEditing(u);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setError(null);
    setSuccess(null);
    setSavingEdit(true);
    try {
      const payload: {
        fullName: string;
        email: string;
        role: UserRow["role"];
        password?: string;
      } = {
        fullName: editFullName.trim().slice(0, DEFAULT_TEXTBOX_MAX_LENGTH),
        email: editEmail.trim().slice(0, DEFAULT_TEXTBOX_MAX_LENGTH),
        role: editRole,
      };
      const pwd = editPassword.trim();
      if (pwd) payload.password = pwd;

      await axios.put(`${apiBase}/auth/admin/users/${editing.id}`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      setSuccess("Đã cập nhật người dùng.");
      setEditing(null);
      setEditPassword("");
      await load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Cập nhật thất bại");
      } else {
        setError("Cập nhật thất bại");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setError(null);
    setSuccess(null);
    setDeletingInProgress(true);
    try {
      await axios.delete(`${apiBase}/auth/admin/users/${deleting.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Đã xóa người dùng.");
      setDeleting(null);
      await load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Xóa thất bại");
      } else {
        setError("Xóa thất bại");
      }
    } finally {
      setDeletingInProgress(false);
    }
  }

  return (
    <main className={ui.content}>
      <div className={ui.wide720}>
        <PageHeader
          title="Quản lý người dùng"
          subtitle="Thêm, sửa, xóa và xem danh sách (chỉ Admin). Mật khẩu: tối thiểu 8 ký tự, có chữ hoa, chữ thường và số. Có thể gán người mới vào một dự án bạn có quyền (chủ hoặc thành viên). Xóa bị chặn nếu user còn làm chủ dự án, là người tạo kịch bản hoặc còn lịch sử chạy."
          actions={
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className={`${ui.btnSecondary} text-xs`}
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Tải lại
            </button>
          }
        />

        {error ? (
          <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        <section className={`${ui.card} overflow-hidden`}>
          <div className="flex flex-col gap-1 rounded-t-2xl border-b border-slate-800/80 bg-slate-950/40 -mx-5 -mt-5 px-5 py-4 mb-0">
            <div className="flex items-center gap-2 text-emerald-400">
              <FiUserPlus className="h-5 w-5 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold text-white tracking-tight">Thêm người dùng</h2>
            </div>
            <p className="text-xs text-slate-500 pl-7 leading-relaxed">
              Điền thông tin tài khoản; có thể gán sẵn vào một dự án nếu cần.
            </p>
          </div>

          <form className="space-y-8 pt-6" onSubmit={handleCreate}>
            <div className="space-y-4">
              <p className={ui.sectionTitle}>Thông tin tài khoản</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={ui.label} htmlFor="au-fullName">
                    Họ và tên
                  </label>
                  <input
                    id="au-fullName"
                    className={ui.input}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                    maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={ui.label} htmlFor="au-email">
                    Email
                  </label>
                  <input
                    id="au-email"
                    type="email"
                    className={ui.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                    maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={ui.label} htmlFor="au-password">
                    Mật khẩu
                  </label>
                  <input
                    id="au-password"
                    type="password"
                    className={ui.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <p className="text-[11px] text-slate-500 leading-snug">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</p>
                </div>
                <div className="space-y-1">
                  <label className={ui.label} htmlFor="au-role">
                    Vai trò
                  </label>
                  <select
                    id="au-role"
                    className={ui.select}
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRow["role"])}
                  >
                    <option value="TESTER">Kiểm thử (TESTER)</option>
                    <option value="VIEWER">Xem (VIEWER)</option>
                    <option value="ADMIN">Quản trị (ADMIN)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-950/25 p-4 sm:p-5">
              <p className={ui.sectionTitle}>Gán vào dự án</p>
              <div className="space-y-1 max-w-xl">
                <label className={ui.label} htmlFor="au-project">
                  Dự án (tuỳ chọn)
                </label>
                <select
                  id="au-project"
                  className={ui.select}
                  value={assignProjectId}
                  onChange={(e) => setAssignProjectId(e.target.value)}
                >
                  <option value="">— Không gán —</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
                  Chỉ hiển thị dự án bạn có quyền (chủ hoặc thành viên). Người mới được thêm làm thành viên dự án.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600 sm:max-w-xs">
                Sau khi tạo, người dùng có thể đăng nhập bằng email và mật khẩu đã đặt.
              </p>
              <button type="submit" className={`${ui.btnPrimary} w-full sm:w-auto shrink-0`} disabled={creating}>
                {creating ? "Đang tạo…" : "Tạo người dùng"}
              </button>
            </div>
          </form>
        </section>

        {editing ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
          >
            <div className={`${ui.card} w-full max-w-lg space-y-4 shadow-2xl`}>
              <div className="flex items-start justify-between gap-3">
                <h2 id="edit-user-title" className="text-lg font-semibold text-white">
                  Sửa người dùng
                </h2>
                <button
                  type="button"
                  className={ui.btnGhost}
                  onClick={() => {
                    setEditing(null);
                    setEditPassword("");
                  }}
                  aria-label="Đóng"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleSaveEdit}>
                <div>
                  <label className={ui.label} htmlFor="edit-fullName">
                    Họ và tên
                  </label>
                  <input
                    id="edit-fullName"
                    className={ui.input}
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                    required
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="edit-email">
                    Email
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    className={ui.input}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                    required
                  />
                </div>
                <div>
                  <label className={ui.label} htmlFor="edit-role">
                    Vai trò
                  </label>
                  <select
                    id="edit-role"
                    className={ui.select}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRow["role"])}
                  >
                    <option value="TESTER">Kiểm thử (TESTER)</option>
                    <option value="VIEWER">Xem (VIEWER)</option>
                    <option value="ADMIN">Quản trị (ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label className={ui.label} htmlFor="edit-password">
                    Mật khẩu mới (tuỳ chọn)
                  </label>
                  <input
                    id="edit-password"
                    type="password"
                    className={ui.input}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Để trống nếu không đổi"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className={ui.btnSecondary}
                    onClick={() => {
                      setEditing(null);
                      setEditPassword("");
                    }}
                  >
                    Huỷ
                  </button>
                  <button type="submit" className={ui.btnPrimary} disabled={savingEdit}>
                    {savingEdit ? "Đang lưu…" : "Lưu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {deleting ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
          >
            <div className={`${ui.card} w-full max-w-md space-y-4 shadow-2xl`}>
              <h2 id="delete-user-title" className="text-lg font-semibold text-white">
                Xóa người dùng?
              </h2>
              <p className="text-sm text-slate-400">
                Tài khoản <strong className="text-slate-200">{deleting.fullName}</strong> ({deleting.email}) sẽ bị xóa
                vĩnh viễn. Thao tác không hoàn tác nếu máy chủ cho phép xóa (không còn dữ liệu phụ thuộc).
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className={ui.btnSecondary} onClick={() => setDeleting(null)} disabled={deletingInProgress}>
                  Huỷ
                </button>
                <button
                  type="button"
                  className={ui.btnDanger}
                  onClick={() => void confirmDelete()}
                  disabled={deletingInProgress}
                >
                  {deletingInProgress ? "Đang xóa…" : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <section className={`${ui.card} space-y-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-white">Danh sách người dùng</h2>
            <div className="relative max-w-md w-full">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="Tìm theo email, họ tên, vai trò…"
                className={`${ui.input} pl-10`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm kiếm người dùng"
              />
            </div>
          </div>

          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>Họ và tên</th>
                  <th className={ui.th}>Email</th>
                  <th className={ui.th}>Vai trò</th>
                  <th className={`${ui.th} text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className={`${ui.td} text-slate-500`} colSpan={4}>
                      Đang tải…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className={`${ui.td} text-slate-500`} colSpan={4}>
                      {users.length === 0 ? "Chưa có người dùng." : "Không khớp bộ lọc tìm kiếm."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className={ui.tr}>
                      <td className={ui.td}>{u.fullName}</td>
                      <td className={`${ui.td} font-mono text-xs text-slate-300`}>{u.email}</td>
                      <td className={ui.td}>
                        <span className="inline-flex rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-0.5 text-xs text-slate-200">
                          {roleLabels[u.role]} ({u.role})
                        </span>
                      </td>
                      <td className={`${ui.td} text-right whitespace-nowrap`}>
                        <button
                          type="button"
                          className={`${ui.btnGhost} inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300`}
                          onClick={() => openEdit(u)}
                        >
                          <FiEdit2 className="h-4 w-4" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          className={`${ui.btnGhost} inline-flex items-center gap-1 text-red-400 hover:text-red-300 ml-1`}
                          onClick={() => {
                            setError(null);
                            setDeleting(u);
                          }}
                          disabled={currentUserId !== null && u.id === currentUserId}
                          title={
                            currentUserId !== null && u.id === currentUserId
                              ? "Không thể xóa chính tài khoản đang đăng nhập"
                              : undefined
                          }
                        >
                          <FiTrash2 className="h-4 w-4" />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
