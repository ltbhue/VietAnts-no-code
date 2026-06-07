"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MultiSelectSearch } from "@/components/MultiSelectSearch";
import { authJsonHeaders, canMutateNoCode, getApiBase, getUserRole } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { FiCopy, FiPlay, FiTrash2 } from "react-icons/fi";

interface Project {
  id: string;
  name: string;
}

interface Suite {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
}

interface SuiteRow extends Suite {
  projectName: string;
}

interface TestCaseListItem {
  id: string;
  title: string;
  versions: Array<{
    id: string;
    version: number;
    content: { lifecycle?: string };
  }>;
}

type FormMode = "create" | "edit" | null;

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;
const ALL_PROJECTS = "__all__";

function SuiteRunsPageInner() {
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [suites, setSuites] = useState<SuiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(ALL_PROJECTS);
  const [suiteId, setSuiteId] = useState("");
  const [selectedSuiteName, setSelectedSuiteName] = useState("");
  const [running, setRunning] = useState(false);
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formProjectId, setFormProjectId] = useState("");
  const [formName, setFormName] = useState("");
  const [formVersionIds, setFormVersionIds] = useState<string[]>([]);
  const [editingSuite, setEditingSuite] = useState<SuiteRow | null>(null);
  const [publishedOptions, setPublishedOptions] = useState<
    Array<{ value: string; label: string; description?: string }>
  >([]);
  const [loadingFormOptions, setLoadingFormOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suiteToDelete, setSuiteToDelete] = useState<SuiteRow | null>(null);

  const apiBase = getApiBase();
  const canMutate = canMutateNoCode(getUserRole());
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const loadProjects = useCallback(async () => {
    if (!token) return;
    const res = await axios.get<Project[]>(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjects(res.data);
  }, [apiBase, token]);

  const loadSuites = useCallback(async () => {
    if (!token || projects.length === 0) {
      setSuites([]);
      return;
    }

    const targetProjects =
      selectedProjectId === ALL_PROJECTS
        ? projects
        : projects.filter((p) => p.id === selectedProjectId);

    const results = await Promise.all(
      targetProjects.map(async (project) => {
        const res = await axios.get<Suite[]>(`${apiBase}/projects/${project.id}/suites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data.map((suite) => ({
          ...suite,
          projectName: project.name,
        }));
      }),
    );

    setSuites(
      results
        .flat()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    );
  }, [apiBase, projects, selectedProjectId, token]);

  const loadPublishedOptions = useCallback(
    async (projectId: string) => {
      if (!token || !projectId) {
        setPublishedOptions([]);
        return;
      }
      setLoadingFormOptions(true);
      try {
        const res = await axios.get<TestCaseListItem[]>(`${apiBase}/projects/${projectId}/tests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const options = res.data
          .map((tc) => {
            const latest = tc.versions[0];
            if (!latest || latest.content?.lifecycle !== "Published") return null;
            return {
              value: latest.id,
              label: tc.title,
              description: `Phiên bản ${latest.version} · Published`,
            };
          })
          .filter((o): o is { value: string; label: string; description: string } => o !== null);
        setPublishedOptions(options);
      } catch {
        setPublishedOptions([]);
        setError("Không tải được danh sách test case Published.");
      } finally {
        setLoadingFormOptions(false);
      }
    },
    [apiBase, token],
  );

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
        await loadSuites();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải được danh sách suite");
      }
    })();
  }, [projects, loadSuites]);

  useEffect(() => {
    if (!formMode || !formProjectId) return;
    void loadPublishedOptions(formProjectId);
  }, [formMode, formProjectId, loadPublishedOptions]);

  const filteredSuites = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return suites;
    return suites.filter(
      (suite) =>
        suite.name.toLowerCase().includes(keyword) ||
        suite.id.toLowerCase().includes(keyword) ||
        suite.projectName.toLowerCase().includes(keyword),
    );
  }, [suites, search]);

  const hasActiveFilters = search.trim() !== "" || selectedProjectId !== ALL_PROJECTS;

  function resetFilters() {
    setSearch("");
    setSelectedProjectId(ALL_PROJECTS);
  }

  function closeForm() {
    setFormMode(null);
    setEditingSuite(null);
    setFormName("");
    setFormVersionIds([]);
    setPublishedOptions([]);
  }

  function openCreateForm() {
    setError(null);
    setNotice(null);
    const defaultProject =
      selectedProjectId !== ALL_PROJECTS
        ? selectedProjectId
        : projectIdFilter && projects.some((p) => p.id === projectIdFilter)
          ? projectIdFilter
          : projects[0]?.id ?? "";
    setFormProjectId(defaultProject);
    setFormName("");
    setFormVersionIds([]);
    setEditingSuite(null);
    setFormMode("create");
  }

  async function openEditForm(suite: SuiteRow) {
    if (!token) return;
    setError(null);
    setNotice(null);
    setEditingSuite(suite);
    setFormProjectId(suite.projectId);
    setFormName(suite.name);
    setFormMode("edit");
    try {
      const res = await axios.get<{
        items: Array<{ testCaseVersionId: string }>;
      }>(`${apiBase}/projects/${suite.projectId}/suites/${suite.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormVersionIds(res.data.items.map((item) => item.testCaseVersionId));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải được chi tiết suite");
      closeForm();
    }
  }

  async function saveSuite(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !canMutate) return;

    const normalizedName = formName.trim();
    if (!normalizedName) {
      setError("Tên suite là bắt buộc.");
      return;
    }
    if (!formProjectId) {
      setError("Chọn dự án.");
      return;
    }
    if (formVersionIds.length === 0) {
      setError("Chọn ít nhất một test case Published.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    const payload = {
      name: normalizedName,
      items: formVersionIds.map((testCaseVersionId, index) => ({
        testCaseVersionId,
        sortOrder: index,
      })),
    };

    try {
      if (formMode === "create") {
        await axios.post(`${apiBase}/projects/${formProjectId}/suites`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotice("Đã tạo suite.");
      } else if (formMode === "edit" && editingSuite) {
        await axios.put(
          `${apiBase}/projects/${editingSuite.projectId}/suites/${editingSuite.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setNotice("Đã cập nhật suite.");
      }
      closeForm();
      await loadSuites();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không lưu được suite");
    } finally {
      setSaving(false);
    }
  }

  async function removeSuite(suite: SuiteRow) {
    if (!token || !canMutate) return;
    setError(null);
    setNotice(null);
    try {
      await axios.delete(`${apiBase}/projects/${suite.projectId}/suites/${suite.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (suiteId === suite.id) {
        setSuiteId("");
        setSelectedSuiteName("");
      }
      setSuiteToDelete(null);
      setNotice(`Đã xóa suite «${suite.name}».`);
      await loadSuites();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không xóa được suite");
    }
  }

  function selectSuite(suite: SuiteRow) {
    setSuiteId(suite.id);
    setSelectedSuiteName(suite.name);
    setNotice(`Đã chọn suite «${suite.name}». Bấm «Chạy suite» để thực thi.`);
    setError(null);
  }

  async function copySuiteId(id: string, name: string) {
    try {
      await navigator.clipboard.writeText(id);
      setNotice(`Đã copy Suite ID của «${name}».`);
      setError(null);
    } catch {
      setError("Không copy được Suite ID.");
    }
  }

  async function runSuite(targetId?: string) {
    const id = (targetId ?? suiteId).trim();
    if (!id) {
      setError("Chọn suite trong danh sách hoặc dán Suite ID.");
      return;
    }
    if (!canMutate) {
      setError("Bạn không có quyền chạy suite.");
      return;
    }

    setRunning(true);
    setRunningSuiteId(id);
    setResult(null);
    setLastRunId(null);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/suites/${encodeURIComponent(id)}/runs`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ environment: "staging" }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(`Chạy suite lỗi (${res.status}): ${text || "Không có chi tiết lỗi."}`);
        return;
      }
      setResult(`${res.status} ${text}`);
      try {
        const data = JSON.parse(text) as { runId?: string; status?: string };
        if (data.runId) {
          setLastRunId(data.runId);
          setNotice(
            `Suite chạy xong (trạng thái: ${data.status ?? "—"}). Xem kết quả tại Báo cáo.`,
          );
        } else {
          setNotice("Đã gửi yêu cầu chạy suite.");
        }
      } catch {
        setNotice("Đã gửi yêu cầu chạy suite.");
      }
    } catch {
      setError("Không gọi được API chạy suite. Kiểm tra mạng hoặc backend.");
    } finally {
      setRunning(false);
      setRunningSuiteId(null);
    }
  }

  const totalItems = suites.reduce((sum, s) => sum + (s._count?.items ?? 0), 0);

  return (
    <main className={ui.content}>
      <div className={ui.wide}>
        <PageHeader
          title="Bộ kiểm thử"
          subtitle="Quản lý test suite: tạo, sửa, xóa, copy Suite ID và chạy regression."
          actions={
            canMutate ? (
              <button type="button" onClick={openCreateForm} className={ui.btnPrimary}>
                + Tạo suite
              </button>
            ) : (
              <Link href="/reports" className={ui.btnSecondary}>
                → Báo cáo runs
              </Link>
            )
          }
        />

        {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
        {error && <p className={`${ui.alertError} mb-3`}>{error}</p>}
        {notice && <p className={`${ui.alertOk} mb-3`}>{notice}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className={ui.statCard}>
            <div className="text-xs text-slate-500">Tổng suite</div>
            <div className="text-2xl font-semibold text-white mt-1">{suites.length}</div>
          </div>
          <div className={ui.statCard}>
            <div className="text-xs text-slate-500">Tổng test case trong suite</div>
            <div className="text-2xl font-semibold text-indigo-300 mt-1">{totalItems}</div>
          </div>
          <div className={ui.statCard}>
            <div className="text-xs text-slate-500">Suite đang chọn</div>
            <div className="text-sm font-medium text-emerald-300 mt-2 truncate">
              {selectedSuiteName || suiteId ? selectedSuiteName || suiteId : "—"}
            </div>
          </div>
        </div>

        <section className={`${ui.card} mb-6 space-y-4`}>
          <p className={ui.sectionTitle}>Chạy suite</p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className={ui.label} htmlFor="suite-id">
                Suite ID
              </label>
              <input
                id="suite-id"
                className={`${ui.input} font-mono text-xs`}
                value={suiteId}
                onChange={(e) => {
                  setSuiteId(e.target.value);
                  setSelectedSuiteName("");
                }}
                placeholder="Chọn từ danh sách bên dưới hoặc dán Suite ID…"
              />
            </div>
            <button
              type="button"
              onClick={() => void runSuite()}
              disabled={running || !canMutate}
              className={`${ui.btnPrimary} gap-2`}
            >
              <FiPlay className="h-4 w-4" aria-hidden />
              {running ? "Đang chạy…" : "Chạy suite"}
            </button>
          </div>
          {result && <pre className={ui.pre}>{result}</pre>}
          {!canMutate && (
            <p className="text-xs text-slate-500">Tài khoản Viewer chỉ xem danh sách, không chạy suite.</p>
          )}
          <Link
            href={lastRunId ? `/reports?runId=${encodeURIComponent(lastRunId)}` : "/reports"}
            className={ui.link}
          >
            → {lastRunId ? "Mở báo cáo lần chạy vừa rồi" : "Xem báo cáo runs"}
          </Link>
        </section>

        <section className={ui.card}>
          <p className={`${ui.sectionTitle} mb-4`}>Danh sách suite</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end">
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
              <label className={ui.label}>Tìm kiếm</label>
              <input
                className={ui.input}
                value={search}
                onChange={(e) => setSearch(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="Tên suite, Suite ID hoặc dự án…"
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
                  <th className={ui.th}>Tên suite</th>
                  <th className={ui.th}>Dự án</th>
                  <th className={ui.th}>Số test case</th>
                  <th className={ui.th}>Cập nhật</th>
                  <th className={ui.th}>Suite ID</th>
                  <th className={ui.th}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuites.map((suite, idx) => (
                  <tr
                    key={suite.id}
                    className={`${ui.tr} ${suiteId === suite.id ? "bg-emerald-950/20" : ""}`}
                  >
                    <td className={`${ui.td} text-slate-400`}>{idx + 1}</td>
                    <td className={`${ui.td} font-medium text-white`}>{suite.name}</td>
                    <td className={`${ui.td} text-slate-300`}>{suite.projectName}</td>
                    <td className={`${ui.td} text-slate-300`}>{suite._count?.items ?? 0}</td>
                    <td className={`${ui.td} text-slate-400 whitespace-nowrap`}>
                      {new Date(suite.updatedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className={ui.td}>
                      <code className="block max-w-[140px] truncate text-[11px] text-slate-400" title={suite.id}>
                        {suite.id}
                      </code>
                      <button
                        type="button"
                        onClick={() => void copySuiteId(suite.id, suite.name)}
                        className={`${ui.btnSm} mt-1 inline-flex items-center gap-1 bg-slate-800 text-slate-200 hover:bg-slate-700`}
                      >
                        <FiCopy className="h-3 w-3" aria-hidden />
                        Copy ID
                      </button>
                    </td>
                    <td className={ui.td}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => selectSuite(suite)}
                          className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700`}
                        >
                          Chọn
                        </button>
                        {canMutate && (
                          <>
                            <button
                              type="button"
                              onClick={() => void openEditForm(suite)}
                              className={`${ui.btnSm} bg-indigo-900/50 text-indigo-200 hover:bg-indigo-900/80`}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                selectSuite(suite);
                                void runSuite(suite.id);
                              }}
                              disabled={running && runningSuiteId === suite.id}
                              className={`${ui.btnSm} inline-flex items-center gap-1 bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900/80 disabled:opacity-50`}
                            >
                              <FiPlay className="h-3 w-3" aria-hidden />
                              Chạy
                            </button>
                            <button
                              type="button"
                              onClick={() => setSuiteToDelete(suite)}
                              className="inline-flex items-center justify-center rounded-md bg-red-900/40 p-1.5 text-red-300 hover:bg-red-900/70"
                              aria-label={`Xóa suite ${suite.name}`}
                              title="Xóa suite"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSuites.length === 0 && !loading && (
            <p className="text-xs text-slate-400 mt-4">
              {suites.length === 0
                ? "Chưa có suite. Bấm «Tạo suite» để gom các test case đã Publish."
                : "Không có suite khớp bộ lọc."}
            </p>
          )}
        </section>
      </div>

      {formMode && canMutate && (
        <div className={ui.modalOverlay} role="dialog" aria-modal="true">
          <form onSubmit={saveSuite} className={`${ui.modalBoxMd} max-w-lg space-y-4`}>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {formMode === "create" ? "Tạo suite mới" : "Sửa suite"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Chỉ chọn test case trạng thái <strong className="text-slate-400">Published</strong>.
              </p>
            </div>

            <div>
              <label className={ui.label}>Dự án</label>
              <select
                className={ui.select}
                value={formProjectId}
                onChange={(e) => {
                  setFormProjectId(e.target.value);
                  setFormVersionIds([]);
                }}
                disabled={formMode === "edit"}
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
              <label className={ui.label}>Tên suite</label>
              <input
                className={ui.input}
                value={formName}
                onChange={(e) => setFormName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="Ví dụ: Regression đăng nhập"
                required
              />
            </div>

            <div>
              <label className={ui.label} htmlFor="suite-test-cases">
                Test case trong suite
              </label>
              {loadingFormOptions ? (
                <p className="text-sm text-slate-400">Đang tải test case Published…</p>
              ) : publishedOptions.length === 0 ? (
                <p className="text-sm text-amber-200/90">
                  Chưa có test case Published trong dự án này. Publish tại{" "}
                  <Link href="/editor" className="text-emerald-400 hover:underline">
                    Biên tập
                  </Link>{" "}
                  hoặc{" "}
                  <Link href="/recorder" className="text-emerald-400 hover:underline">
                    Ghi thao tác
                  </Link>
                  .
                </p>
              ) : (
                <MultiSelectSearch
                  id="suite-test-cases"
                  options={publishedOptions}
                  value={formVersionIds}
                  onChange={setFormVersionIds}
                  searchPlaceholder="Tìm theo tên test case…"
                  emptyMessage="Không tìm thấy test case Published."
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeForm} className={ui.btnSecondary}>
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || publishedOptions.length === 0}
                className={ui.btnPrimary}
              >
                {saving ? "Đang lưu…" : formMode === "create" ? "Tạo suite" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {suiteToDelete && canMutate && (
        <div className={ui.modalOverlay} role="dialog" aria-modal="true">
          <div className={ui.modalBoxMd}>
            <h3 className="text-lg font-semibold text-white">Xác nhận xóa suite</h3>
            <p className="text-sm text-slate-300">
              Bạn có chắc muốn xóa suite{" "}
              <span className="font-medium text-slate-100">{suiteToDelete.name}</span>?
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Các lần chạy suite liên quan cũng có thể bị ảnh hưởng.
            </p>
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => setSuiteToDelete(null)} className={ui.btnSecondary}>
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void removeSuite(suiteToDelete)}
                className={ui.btnDanger}
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

export default function SuiteRunsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải…</main>}>
      <SuiteRunsPageInner />
    </Suspense>
  );
}
