"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { useEffect, useState } from "react";

type ActionType = "navigate" | "click" | "fill" | "assertText";
type DraftAction = { type: ActionType; selector?: string; value?: string; expected?: string };
type Project = { id: string; name: string };
const DEFAULT_TEXTBOX_MAX_LENGTH = 255;
const DEFAULT_SCRIPT_IMPORT_MAX_LENGTH = 20000;

function normalizeQuoted(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith("`") && trimmed.endsWith("`"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parsePlaywrightScriptToActions(source: string): DraftAction[] {
  const actions: DraftAction[] = [];
  const lines = source.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const gotoMatch = line.match(/page\.goto\((.+?)\)/);
    if (gotoMatch) {
      const url = normalizeQuoted(gotoMatch[1]);
      if (url) actions.push({ type: "navigate", selector: url });
      continue;
    }

    const clickMatch = line.match(/(?:page|locator)\.getBy\w+\((.+?)\)\.click\(/);
    if (clickMatch) {
      const selector = normalizeQuoted(clickMatch[1]);
      if (selector) actions.push({ type: "click", selector });
      continue;
    }
    const locatorClickMatch = line.match(/page\.locator\((.+?)\)\.click\(/);
    if (locatorClickMatch) {
      const selector = normalizeQuoted(locatorClickMatch[1]);
      if (selector) actions.push({ type: "click", selector });
      continue;
    }

    const fillMatch = line.match(/page\.locator\((.+?)\)\.fill\((.+?)\)/);
    if (fillMatch) {
      const selector = normalizeQuoted(fillMatch[1]);
      const value = normalizeQuoted(fillMatch[2]);
      if (selector) actions.push({ type: "fill", selector, value });
      continue;
    }
    const roleFillMatch = line.match(/(?:page|locator)\.getBy\w+\((.+?)\)\.fill\((.+?)\)/);
    if (roleFillMatch) {
      const selector = normalizeQuoted(roleFillMatch[1]);
      const value = normalizeQuoted(roleFillMatch[2]);
      if (selector) actions.push({ type: "fill", selector, value });
      continue;
    }

    const assertMatch = line.match(/expect\(.+?\)\.(?:toContainText|toHaveText)\((.+?)\)/);
    if (assertMatch) {
      const expected = normalizeQuoted(assertMatch[1]);
      if (expected) actions.push({ type: "assertText", selector: "body", expected });
      continue;
    }
  }
  return actions;
}

function toRecordedStep(action: DraftAction): Record<string, unknown> | null {
  if (!action.selector?.trim()) return null;
  if (action.type === "click") {
    return { kind: "recorded.click", selector: action.selector.trim() };
  }
  if (action.type === "fill") {
    return {
      kind: "keyword.fill",
      selector: action.selector.trim(),
      value: action.value?.trim() ?? "",
    };
  }
  if (action.type === "assertText") {
    return {
      kind: "keyword.assertText",
      selector: action.selector.trim(),
      expected: action.expected?.trim() ?? "",
    };
  }
  return null;
}

export default function RecorderPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectId, setProjectId] = useState("");
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
          if (data.length > 0) setProjectId((prev) => prev || data[0].id);
        }
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, []);

  function addAction() {
    setError(null);
    setNotice(null);
    const normalizedSelector = selector.trim();
    const normalizedValue = value.trim();
    const normalizedExpected = expected.trim();
    if (!normalizedSelector) {
      setError("Bộ chọn là bắt buộc khi thêm thao tác.");
      return;
    }
    setActions((prev) => [
      ...prev,
      {
        type: actionType,
        selector: normalizedSelector,
        value: normalizedValue || undefined,
        expected: normalizedExpected || undefined,
      },
    ]);
    setNotice("Đã thêm thao tác.");
  }

  function removeAction(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
    setNotice("Đã xóa thao tác.");
  }

  function clearAll() {
    setActions([]);
    setImportScript("");
    setSmartPreview(null);
    setResult(null);
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
    setActions(parsed);
    const firstNavigate = parsed.find((a) => a.type === "navigate" && a.selector)?.selector;
    if (firstNavigate) {
      setUrl(firstNavigate);
    }
    setNotice(`Đã nhập ${parsed.length} thao tác từ script.`);
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
      const steps = [
        { kind: "keyword.navigate", url: url.trim() },
        ...actions.map(toRecordedStep).filter(Boolean),
      ];
      if (steps.length < 2) {
        setError("Bạn cần ít nhất 1 thao tác hợp lệ (click/fill/assertText) ngoài bước mở trang.");
        return;
      }
      const res = await fetch(`${getApiBase()}/projects/${encodeURIComponent(projectId.trim())}/tests`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          name: name.trim() || "Kịch bản ghi nhanh",
          platform: "desktop-web",
          steps,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(`Tạo test draft lỗi (${res.status}): ${text || "Không có chi tiết lỗi."}`);
        return;
      }
      setResult(`${res.status} ${text}`);
      setNotice("Đã gửi yêu cầu tạo test nháp.");
    } catch {
      setError("Không gửi được yêu cầu tạo test nháp.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={ui.content}>
      <div className={ui.wide720}>
        <PageHeader
          title="Ghi thao tác thông minh"
          subtitle="Cấu hình bên trái, xem danh sách thao tác và phản hồi API bên phải — làm việc song song trên màn hình lớn."
        />
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
              disabled={loadingProjects || projects.length === 0}
            >
              {loadingProjects && <option>Đang tải dự án...</option>}
              {!loadingProjects && projects.length === 0 && <option>Không có dự án</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {projectId && <p className="mt-1 text-[11px] text-slate-500">Mã dự án: {projectId}</p>}
          </label>
          <label className="block">
            <span className={ui.label}>URL mục tiêu</span>
            <input
              className={ui.input}
              value={url}
              onChange={(e) => setUrl(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
            />
          </label>
          <label className="block">
            <span className={ui.label}>Tên ca kiểm thử</span>
            <input
              className={ui.input}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
            />
          </label>

          <div className="rounded-xl border border-slate-800/90 bg-slate-950/40 p-4 space-y-3">
            <div className="text-sm font-medium text-slate-200">Thêm thao tác</div>
            <select
              className={ui.select}
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ActionType)}
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
            />
            <input
              className={ui.input}
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              placeholder="giá trị (cho fill)"
            />
            <input
              className={ui.input}
              value={expected}
              onChange={(e) => setExpected(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              placeholder="giá trị mong đợi (cho assertText)"
            />
            <button type="button" onClick={addAction} className={ui.btnSecondary}>
              + Thêm thao tác
            </button>
          </div>

          <div className="rounded-xl border border-slate-800/90 bg-slate-950/40 p-4 space-y-3">
            <div className="text-sm font-medium text-slate-200">Tự động nhập từ Playwright codegen (MVP)</div>
            <textarea
              className={`${ui.textarea} font-mono text-xs min-h-[150px]`}
              value={importScript}
              onChange={(e) => setImportScript(e.target.value.slice(0, DEFAULT_SCRIPT_IMPORT_MAX_LENGTH))}
              maxLength={DEFAULT_SCRIPT_IMPORT_MAX_LENGTH}
              placeholder="Dán script Playwright, ví dụ: page.goto(...); page.locator(...).click(); page.locator(...).fill(...);"
            />
            <button type="button" onClick={importFromScript} className={ui.btnIndigo}>
              Phân tích script thành thao tác
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void analyzeSmart()} disabled={analyzing} className={ui.btnIndigo}>
              {analyzing ? "Đang phân tích…" : "Phân tích thông minh"}
            </button>
            <button type="button" onClick={() => void submit()} disabled={submitting} className={ui.btnPrimary}>
              {submitting ? "Đang gửi…" : "Gửi tạo test nháp"}
            </button>
            <button type="button" onClick={clearAll} className={ui.btnSecondary}>
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
            <pre className={`${ui.pre} min-h-[180px]`}>
              {JSON.stringify(actions, null, 2)}
            </pre>
            {actions.length > 0 && (
              <div className="mt-2 space-y-1">
                {actions.map((action, idx) => (
                  <div key={`${action.type}-${idx}`} className="flex items-center justify-between rounded border border-slate-800 px-2 py-1 text-xs">
                    <span className="text-slate-300">
                      #{idx + 1} {action.type} {action.selector ? `- ${action.selector}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAction(idx)}
                      className="text-red-300 hover:underline"
                    >
                      Xóa
                    </button>
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
              <div className="text-xs text-slate-400">Phản hồi tạo test</div>
              <button
                type="button"
                onClick={() => void copyText("phản hồi tạo test", result || "")}
                disabled={!result}
                className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40`}
              >
                Sao chép
              </button>
            </div>
            <pre className={`${ui.pre} min-h-[120px]`}>
              {result || "Chưa có dữ liệu. Hãy bấm Gửi tạo test nháp."}
            </pre>
          </div>
        </section>
      </div>
    </div>
    </main>
  );
}
