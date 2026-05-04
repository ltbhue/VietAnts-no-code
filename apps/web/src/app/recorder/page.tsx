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
  const [name, setName] = useState("Smart Recorder Case");
  const [url, setUrl] = useState("https://example.com");
  const [actionType, setActionType] = useState<ActionType>("click");
  const [selector, setSelector] = useState("[data-test='submit']");
  const [value, setValue] = useState("");
  const [expected, setExpected] = useState("");
  const [actions, setActions] = useState<DraftAction[]>([]);
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
      setError("Selector là bắt buộc khi thêm action.");
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
    setNotice("Đã thêm action.");
  }

  function removeAction(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
    setNotice("Đã xóa action.");
  }

  function clearAll() {
    setActions([]);
    setSmartPreview(null);
    setResult(null);
    setNotice("Đã xóa toàn bộ actions và kết quả.");
    setError(null);
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
      setError("Project ID là bắt buộc.");
      return false;
    }
    if (!normalizedUrl) {
      setError("URL mục tiêu là bắt buộc.");
      return false;
    }
    if (actions.length === 0) {
      setError("Bạn cần thêm ít nhất 1 action.");
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
        setError(`Smart Analyze lỗi (${res.status}): ${text || "Không có chi tiết lỗi."}`);
        return;
      }
      setSmartPreview(`${res.status} ${text}`);
      setNotice("Đã phân tích smart recorder.");
    } catch {
      setError("Không gọi được Smart Analyze. Kiểm tra API hoặc mạng.");
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
        setError("Bạn cần ít nhất 1 action hợp lệ (click/fill/assertText) ngoài bước mở trang.");
        return;
      }
      const res = await fetch(`${getApiBase()}/projects/${encodeURIComponent(projectId.trim())}/tests`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          name: name.trim() || "Smart Recorder Case",
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
      setNotice("Đã gửi tạo test draft.");
    } catch {
      setError("Không gửi được yêu cầu tạo test draft.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={ui.content}>
      <div className={ui.wide720}>
        <PageHeader
          title="Smart Recorder"
          subtitle="Cấu hình bên trái, xem actions và phản hồi API bên phải — làm việc song song trên màn hình lớn."
        />
      {error && <p className={`${ui.alertError} mb-3`}>{error}</p>}
      {notice && <p className={`${ui.alertOk} mb-3`}>{notice}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <section className={`${ui.card} space-y-4`}>
          <p className={ui.sectionTitle}>Cấu hình</p>
          <label className="block">
            <span className={ui.label}>Project</span>
            <select
              className={ui.select}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loadingProjects || projects.length === 0}
            >
              {loadingProjects && <option>Đang tải project...</option>}
              {!loadingProjects && projects.length === 0 && <option>Không có project</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {projectId && <p className="mt-1 text-[11px] text-slate-500">Project ID: {projectId}</p>}
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
            <span className={ui.label}>Tên test</span>
            <input
              className={ui.input}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
            />
          </label>

          <div className="rounded-xl border border-slate-800/90 bg-slate-950/40 p-4 space-y-3">
            <div className="text-sm font-medium text-slate-200">Thêm action</div>
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
              placeholder="selector"
            />
            <input
              className={ui.input}
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              placeholder="value (cho fill)"
            />
            <input
              className={ui.input}
              value={expected}
              onChange={(e) => setExpected(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              placeholder="expected (cho assertText)"
            />
            <button type="button" onClick={addAction} className={ui.btnSecondary}>
              + Thêm action
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void analyzeSmart()} disabled={analyzing} className={ui.btnIndigo}>
              {analyzing ? "Đang phân tích…" : "Smart Analyze"}
            </button>
            <button type="button" onClick={() => void submit()} disabled={submitting} className={ui.btnPrimary}>
              {submitting ? "Đang gửi…" : "Gửi tạo test (draft)"}
            </button>
            <button type="button" onClick={clearAll} className={ui.btnSecondary}>
              Xóa tất cả
            </button>
          </div>
          <Link href="/editor" className={ui.link}>
            → Biên tập & publish
          </Link>
        </section>

        <section className={`${ui.card} space-y-4`}>
          <p className={ui.sectionTitle}>Kết quả & JSON</p>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-400">Actions hiện tại ({actions.length})</div>
              <button
                type="button"
                onClick={() => void copyText("actions JSON", JSON.stringify(actions, null, 2))}
                className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700`}
              >
                Copy JSON
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
              <div className="text-xs text-slate-400">Smart analyze response</div>
              <button
                type="button"
                onClick={() => void copyText("smart analyze response", smartPreview || "")}
                disabled={!smartPreview}
                className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40`}
              >
                Copy
              </button>
            </div>
            <pre className={`${ui.pre} min-h-[120px] border-indigo-800/50`}>
              {smartPreview || "Chưa có dữ liệu. Hãy bấm Smart Analyze."}
            </pre>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-400">Tạo test response</div>
              <button
                type="button"
                onClick={() => void copyText("create test response", result || "")}
                disabled={!result}
                className={`${ui.btnSm} bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40`}
              >
                Copy
              </button>
            </div>
            <pre className={`${ui.pre} min-h-[120px]`}>
              {result || "Chưa có dữ liệu. Hãy bấm Gửi tạo test (draft)."}
            </pre>
          </div>
        </section>
      </div>
    </div>
    </main>
  );
}
