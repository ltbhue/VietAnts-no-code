"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiCopy, FiEdit2 } from "react-icons/fi";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import {
  type ActionType,
  type DraftAction,
  buildDraftSteps,
  parsePlaywrightScriptToActions,
  stepsToDraftState,
} from "@/lib/recorder-actions";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";

type Project = { id: string; name: string };

type RecorderWorkspaceProps = {
  mode: "create" | "edit";
  initialProjectId?: string;
  initialTestCaseId?: string;
};

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;
const DEFAULT_SCRIPT_IMPORT_MAX_LENGTH = 20000;

function buildCodegenCommand(targetUrl: string): string {
  const safeUrl = targetUrl.trim() || "https://example.com";
  return `npx playwright codegen "${safeUrl}"`;
}

function buildSamplePlaywrightScript(targetUrl: string): string {
  const safeUrl = targetUrl.trim() || "https://example.com";
  return [
    `await page.goto('${safeUrl}');`,
    `await page.locator('#email').fill('user@example.com');`,
    `await page.locator('#password').fill('Secret123');`,
    `await page.locator('button[type=submit]').click();`,
    `await expect(page.locator('.message')).toHaveText('Đăng nhập thành công');`,
  ].join("\n");
}

export function RecorderWorkspace({ mode, initialProjectId, initialTestCaseId }: RecorderWorkspaceProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const testCaseId = initialTestCaseId?.trim() ?? "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingCase, setLoadingCase] = useState(isEdit);
  const [projectId, setProjectId] = useState(initialProjectId?.trim() ?? "");
  const [name, setName] = useState("Kịch bản ghi nhanh");
  const [url, setUrl] = useState("https://example.com");
  const [actionType, setActionType] = useState<ActionType>("click");
  const [selector, setSelector] = useState("[data-test='submit']");
  const [value, setValue] = useState("");
  const [expected, setExpected] = useState("");
  const [actions, setActions] = useState<DraftAction[]>([]);
  const [importScript, setImportScript] = useState("");
  const [smartPreview, setSmartPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      queueMicrotask(() => setLoadingProjects(false));
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/projects`, {
          headers: authJsonHeaders(),
        });
        const data = (await res.json().catch(() => [])) as Project[];
        if (Array.isArray(data)) {
          setProjects(data);
          if (!isEdit && data.length > 0) {
            setProjectId((prev) => prev || initialProjectId?.trim() || data[0].id);
          }
        }
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, [initialProjectId, isEdit]);

  useEffect(() => {
    if (!isEdit || !testCaseId || !initialProjectId?.trim()) {
      queueMicrotask(() => setLoadingCase(false));
      return;
    }
    const pid = initialProjectId.trim();
    queueMicrotask(() => {
      setProjectId(pid);
    });
    (async () => {
      setLoadingCase(true);
      setError(null);
      try {
        const res = await fetch(
          `${getApiBase()}/projects/${encodeURIComponent(pid)}/tests/${encodeURIComponent(testCaseId)}`,
          { headers: authJsonHeaders() },
        );
        const text = await res.text();
        if (!res.ok) {
          setError(`Không tải được test case (${res.status}): ${text || "Không có chi tiết lỗi."}`);
          return;
        }
        const data = JSON.parse(text) as {
          title?: string;
          content?: { lifecycle?: string; platform?: string; steps?: unknown[] };
        };
        if (data.content?.lifecycle === "Published") {
          setError("Test case đã Published — không thể chỉnh sửa tại đây.");
          return;
        }
        setName(data.title?.trim() || "Kịch bản ghi nhanh");
        const draft = stepsToDraftState(Array.isArray(data.content?.steps) ? data.content.steps : []);
        setUrl(draft.url);
        setActions(draft.actions);
        setNotice("Đã tải dữ liệu test case để chỉnh sửa.");
      } catch {
        setError("Không tải được test case. Kiểm tra API hoặc mạng.");
      } finally {
        setLoadingCase(false);
      }
    })();
  }, [initialProjectId, isEdit, testCaseId]);

  function resetActionForm() {
    setActionType("click");
    setSelector("[data-test='submit']");
    setValue("");
    setExpected("");
    setEditingActionIndex(null);
  }

  function addOrUpdateAction() {
    setError(null);
    setNotice(null);
    const normalizedSelector = selector.trim();
    const normalizedValue = value.trim();
    const normalizedExpected = expected.trim();
    if (!normalizedSelector) {
      setError("Bộ chọn là bắt buộc khi thêm thao tác.");
      return;
    }
    const nextAction: DraftAction = {
      type: actionType,
      selector: normalizedSelector,
      value: normalizedValue || undefined,
      expected: normalizedExpected || undefined,
    };
    if (editingActionIndex !== null) {
      setActions((prev) => prev.map((item, i) => (i === editingActionIndex ? nextAction : item)));
      setNotice("Đã cập nhật thao tác.");
      resetActionForm();
      return;
    }
    setActions((prev) => [...prev, nextAction]);
    setNotice("Đã thêm thao tác.");
  }

  function startEditAction(index: number) {
    const action = actions[index];
    if (!action || action.type === "navigate") return;
    setActionType(action.type);
    setSelector(action.selector ?? "");
    setValue(action.value ?? "");
    setExpected(action.expected ?? "");
    setEditingActionIndex(index);
    setNotice(`Đang sửa thao tác #${index + 1}.`);
    setError(null);
  }

  function removeAction(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
    if (editingActionIndex === index) resetActionForm();
    else if (editingActionIndex !== null && editingActionIndex > index) {
      setEditingActionIndex((prev) => (prev === null ? null : prev - 1));
    }
    setNotice("Đã xóa thao tác.");
  }

  function clearAll() {
    setActions([]);
    setImportScript("");
    setSmartPreview(null);
    setResult(null);
    resetActionForm();
    setNotice("Đã xóa toàn bộ thao tác và kết quả.");
    setError(null);
  }

  function importFromScript() {
    setError(null);
    setNotice(null);
    const parsed = parsePlaywrightScriptToActions(importScript);
    if (parsed.length === 0) {
      setError("Không phân tích được thao tác nào từ script. Hãy dán script Playwright codegen hợp lệ.");
      return;
    }
    const navigates = parsed.filter((a) => a.type === "navigate");
    const rest = parsed.filter((a) => a.type !== "navigate");
    if (navigates[0]?.selector) setUrl(navigates[0].selector);
    setActions(rest);
    resetActionForm();
    setNotice(`Đã nhập ${rest.length} thao tác từ script.`);
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`Đã copy ${label}.`);
      setError(null);
    } catch {
      setError(`Không copy được ${label}.`);
    }
  }

  function validateBeforeRun() {
    const normalizedProjectId = projectId.trim();
    const normalizedUrl = url.trim();
    if (!normalizedProjectId) {
      setError("Mã dự án là bắt buộc.");
      return false;
    }
    if (!normalizedUrl) {
      setError("URL mục tiêu là bắt buộc.");
      return false;
    }
    if (actions.length === 0) {
      setError("Bạn cần thêm ít nhất 1 thao tác.");
      return false;
    }
    return true;
  }

  async function analyzeSmart() {
    if (!validateBeforeRun()) return;
    setAnalyzing(true);
    setError(null);
    setNotice(null);
    setSmartPreview(null);
    try {
      const res = await fetch(`${getApiBase()}/projects/${encodeURIComponent(projectId.trim())}/tests/smart-record`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          url: url.trim(),
          actions: [{ type: "navigate" as const, selector: "body" }, ...actions],
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(`Phân tích thông minh lỗi (${res.status}): ${text || "Không có chi tiết lỗi."}`);
        return;
      }
      setSmartPreview(`${res.status} ${text}`);
      setNotice("Đã phân tích ghi thao tác thông minh.");
    } catch {
      setError("Không gọi được chức năng phân tích thông minh. Kiểm tra API hoặc mạng.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function submit() {
    if (!validateBeforeRun()) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    setResult(null);
    try {
      const steps = buildDraftSteps(url, actions);
      if (steps.length < 2) {
        setError("Bạn cần ít nhất 1 thao tác hợp lệ (click/fill/assertText) ngoài bước mở trang.");
        return;
      }
      const payload = {
        name: name.trim() || "Kịch bản ghi nhanh",
        platform: "desktop-web" as const,
        steps,
      };
      const endpoint =
        isEdit && testCaseId
          ? `${getApiBase()}/projects/${encodeURIComponent(projectId.trim())}/tests/${encodeURIComponent(testCaseId)}`
          : `${getApiBase()}/projects/${encodeURIComponent(projectId.trim())}/tests`;
      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(
          `${isEdit ? "Cập nhật" : "Tạo"} test draft lỗi (${res.status}): ${text || "Không có chi tiết lỗi."}`,
        );
        return;
      }
      setResult(`${res.status} ${text}`);
      if (isEdit) {
        setNotice("Đã lưu thay đổi test case Draft.");
        router.push("/recorder");
        return;
      }
      setNotice("Đã tạo test nháp. Đang chuyển sang trang publish…");
      try {
        const created = JSON.parse(text) as { id?: string };
        if (created.id) {
          router.push(
            `/editor?projectId=${encodeURIComponent(projectId.trim())}&testCaseId=${encodeURIComponent(created.id)}`,
          );
          return;
        }
      } catch {
        // giữ phản hồi thô nếu không parse được JSON
      }
    } catch {
      setError(`Không gửi được yêu cầu ${isEdit ? "cập nhật" : "tạo"} test nháp.`);
    } finally {
      setSubmitting(false);
    }
  }

  const projectName = projects.find((p) => p.id === projectId)?.name;
  const formDisabled = loadingProjects || loadingCase || (isEdit && !!error && actions.length === 0);
  const codegenCommand = buildCodegenCommand(url);
  const sampleScript = buildSamplePlaywrightScript(url);

  return (
    <main className={ui.content}>
      <div className={ui.wide720}>
        <PageHeader
          title={isEdit ? "Chỉnh sửa ghi thao tác" : "Ghi thao tác mới"}
          subtitle={
            isEdit
              ? "Cập nhật thao tác, tên test case hoặc URL — chỉ áp dụng cho test case ở trạng thái Draft."
              : "Thêm thủ công, import Playwright hoặc phân tích thông minh — sau đó tạo test case Draft."
          }
          actions={
            <Link href="/recorder" className={ui.btnSecondary}>
              ← Danh sách
            </Link>
          }
        />

        {(loadingCase || loadingProjects) && <p className="text-sm text-slate-400 mb-3">Đang tải…</p>}
        {error && <p className={`${ui.alertError} mb-3`}>{error}</p>}
        {notice && <p className={`${ui.alertOk} mb-3`}>{notice}</p>}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <section className={`${ui.card} space-y-4`}>
            <p className={ui.sectionTitle}>Cấu hình</p>
            <label className="block">
              <span className={ui.label}>Dự án</span>
              <select
                className={ui.select}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={loadingProjects || projects.length === 0 || isEdit}
              >
                {loadingProjects && <option>Đang tải dự án...</option>}
                {!loadingProjects && projects.length === 0 && <option>Không có dự án</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {projectId && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {projectName ? `${projectName} · ` : ""}Mã dự án: {projectId}
                  {isEdit && testCaseId ? ` · Test case: ${testCaseId}` : ""}
                </p>
              )}
            </label>
            <label className="block">
              <span className={ui.label}>URL mục tiêu</span>
              <input
                className={ui.input}
                value={url}
                onChange={(e) => setUrl(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                disabled={formDisabled}
              />
            </label>
            <label className="block">
              <span className={ui.label}>Tên ca kiểm thử</span>
              <input
                className={ui.input}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                disabled={formDisabled}
              />
            </label>

            <div className="rounded-xl border border-slate-800/90 bg-slate-950/40 p-4 space-y-3">
              <div className="text-sm font-medium text-slate-200">
                {editingActionIndex !== null ? `Sửa thao tác #${editingActionIndex + 1}` : "Thêm thao tác"}
              </div>
              <select
                className={ui.select}
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                disabled={formDisabled}
              >
                <option value="click">click</option>
                <option value="fill">fill</option>
                <option value="assertText">assertText</option>
              </select>
              <input
                className={ui.input}
                value={selector}
                onChange={(e) => setSelector(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="bộ chọn (selector)"
                disabled={formDisabled}
              />
              <input
                className={ui.input}
                value={value}
                onChange={(e) => setValue(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="giá trị (cho fill)"
                disabled={formDisabled}
              />
              <input
                className={ui.input}
                value={expected}
                onChange={(e) => setExpected(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="giá trị mong đợi (cho assertText)"
                disabled={formDisabled}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={addOrUpdateAction} className={ui.btnSecondary} disabled={formDisabled}>
                  {editingActionIndex !== null ? "Lưu thao tác" : "+ Thêm thao tác"}
                </button>
                {editingActionIndex !== null && (
                  <button type="button" onClick={resetActionForm} className={ui.btnGhost}>
                    Huỷ sửa
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-900/40 bg-slate-950/50 p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-200">Nhập từ Playwright — chỉ cần Copy</div>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Copy lệnh hoặc mẫu bên dưới, chạy Codegen ngoài terminal, rồi dán script vào ô cuối.
                </p>
              </div>

              <ol className="space-y-3 text-xs text-slate-400">
                <li className="space-y-2">
                  <span className="font-medium text-slate-300">Bước 1 — Copy lệnh mở Codegen</span>
                  <div className="flex flex-wrap items-stretch gap-2">
                    <pre className={`${ui.pre} min-h-0 flex-1 py-2 text-[11px] text-indigo-200/90`}>
                      {codegenCommand}
                    </pre>
                    <button
                      type="button"
                      onClick={() => void copyText("lệnh codegen", codegenCommand)}
                      className={`${ui.btnSm} shrink-0 inline-flex items-center gap-1.5 bg-indigo-900/50 text-indigo-100 hover:bg-indigo-900/80 px-3`}
                    >
                      <FiCopy className="h-3.5 w-3.5" aria-hidden />
                      Copy lệnh
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Dán vào terminal (PowerShell / CMD), thao tác trên web, copy script từ cửa sổ Playwright Inspector.
                  </p>
                </li>

                <li className="space-y-2">
                  <span className="font-medium text-slate-300">Bước 2 — Hoặc copy mẫu script (thử nhanh)</span>
                  <div className="flex flex-wrap items-stretch gap-2">
                    <pre className={`${ui.pre} min-h-0 flex-1 max-h-32 py-2 text-[11px] text-slate-300`}>
                      {sampleScript}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        setImportScript(sampleScript);
                        setNotice("Đã dán mẫu script vào ô bên dưới. Bấm «Phân tích script thành thao tác».");
                        setError(null);
                      }}
                      className={`${ui.btnSm} shrink-0 inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 px-3`}
                    >
                      <FiCopy className="h-3.5 w-3.5" aria-hidden />
                      Dùng mẫu
                    </button>
                  </div>
                </li>

                <li className="space-y-2">
                  <span className="font-medium text-slate-300">Bước 3 — Dán script và phân tích</span>
                  <textarea
                    className={`${ui.textarea} font-mono text-xs min-h-[120px]`}
                    value={importScript}
                    onChange={(e) => setImportScript(e.target.value.slice(0, DEFAULT_SCRIPT_IMPORT_MAX_LENGTH))}
                    maxLength={DEFAULT_SCRIPT_IMPORT_MAX_LENGTH}
                    placeholder="Dán script từ Playwright Inspector vào đây…"
                    disabled={formDisabled}
                  />
                  <button type="button" onClick={importFromScript} className={ui.btnIndigo} disabled={formDisabled}>
                    Phân tích script thành thao tác
                  </button>
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void analyzeSmart()}
                disabled={analyzing || formDisabled}
                className={ui.btnIndigo}
              >
                {analyzing ? "Đang phân tích…" : "Phân tích thông minh"}
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || formDisabled}
                className={ui.btnPrimary}
              >
                {submitting
                  ? "Đang gửi…"
                  : isEdit
                    ? "Lưu thay đổi"
                    : "Gửi tạo test nháp"}
              </button>
              <button type="button" onClick={clearAll} className={ui.btnSecondary} disabled={formDisabled}>
                Xóa tất cả
              </button>
            </div>
            <Link href="/editor" className={ui.link}>
              → Biên tập và phát hành
            </Link>
          </section>

          <section className={`${ui.card} space-y-4`}>
            <p className={ui.sectionTitle}>Kết quả và JSON</p>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400">Thao tác hiện tại ({actions.length})</div>
                <button
                  type="button"
                  onClick={() => void copyText("JSON thao tác", JSON.stringify(actions, null, 2))}
                  className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700`}
                >
                  Sao chép JSON
                </button>
              </div>
              <pre className={`${ui.pre} min-h-[180px]`}>{JSON.stringify(actions, null, 2)}</pre>
              {actions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {actions.map((action, idx) => (
                    <div
                      key={`${action.type}-${idx}`}
                      className={`flex items-center justify-between gap-2 rounded border px-2 py-1 text-xs ${
                        editingActionIndex === idx ? "border-emerald-700/60 bg-emerald-950/20" : "border-slate-800"
                      }`}
                    >
                      <span className="min-w-0 truncate text-slate-300">
                        #{idx + 1} {action.type}
                        {action.selector ? ` - ${action.selector}` : ""}
                        {action.value ? ` = ${action.value}` : ""}
                        {action.expected ? ` ? ${action.expected}` : ""}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditAction(idx)}
                          className="inline-flex items-center gap-1 text-emerald-300 hover:underline"
                        >
                          <FiEdit2 className="h-3 w-3" aria-hidden />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAction(idx)}
                          className="text-red-300 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400">Phản hồi phân tích thông minh</div>
                <button
                  type="button"
                  onClick={() => void copyText("phản hồi phân tích thông minh", smartPreview || "")}
                  disabled={!smartPreview}
                  className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40`}
                >
                  Sao chép
                </button>
              </div>
              <pre className={`${ui.pre} min-h-[120px] border-indigo-800/50`}>
                {smartPreview || "Chưa có dữ liệu. Hãy bấm Phân tích thông minh."}
              </pre>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-400">{isEdit ? "Phản hồi cập nhật" : "Phản hồi tạo test"}</div>
                <button
                  type="button"
                  onClick={() => void copyText(isEdit ? "phản hồi cập nhật" : "phản hồi tạo test", result || "")}
                  disabled={!result}
                  className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40`}
                >
                  Sao chép
                </button>
              </div>
              <pre className={`${ui.pre} min-h-[120px]`}>
                {result || (isEdit ? "Chưa có dữ liệu. Hãy bấm Lưu thay đổi." : "Chưa có dữ liệu. Hãy bấm Gửi tạo test nháp.")}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
