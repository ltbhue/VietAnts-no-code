"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useEffect, useState } from "react";

type ActionType = "navigate" | "click" | "fill" | "assertText";
type DraftAction = { type: ActionType; selector?: string; value?: string; expected?: string };
type Project = { id: string; name: string };
const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

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
      setLoadingProjects(false);
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
      const res = await fetch(`${getApiBase()}/projects/${encodeURIComponent(projectId.trim())}/tests`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          name: name.trim() || "Smart Recorder Case",
          platform: "desktop-web",
          steps: actions
            .filter((a) => a.type === "click" && a.selector)
            .map((a) => ({ kind: "recorded.click", selector: a.selector })),
        }),
      });
      const text = await res.text();
      setResult(`${res.status} ${text}`);
      setNotice("Đã gửi tạo test draft.");
    } catch {
      setError("Không gửi được yêu cầu tạo test draft.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-emerald-400">Smart URL Recorder (v1)</h1>
      <p className="text-slate-400 text-sm mt-1 mb-5">
        Chia đôi màn hình: bên trái cấu hình recorder, bên phải kết quả/actions để theo dõi ngay.
      </p>
      {error && <p className="mb-3 rounded border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}
      {notice && <p className="mb-3 rounded border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">{notice}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
          <h2 className="text-sm font-medium text-slate-200">Cấu hình</h2>
          <label className="block">
            <span className="text-sm text-slate-400">Project</span>
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
            <span className="text-sm text-slate-400">URL mục tiêu</span>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">Tên test</span>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
            />
          </label>

          <div className="rounded border border-slate-800 p-3 space-y-2">
            <div className="text-sm text-slate-300">Thêm action</div>
            <select
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ActionType)}
            >
              <option value="click">click</option>
              <option value="fill">fill</option>
              <option value="assertText">assertText</option>
            </select>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={selector}
              onChange={(e) => setSelector(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              placeholder="selector"
            />
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              placeholder="value (cho fill)"
            />
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={expected}
              onChange={(e) => setExpected(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
              placeholder="expected (cho assertText)"
            />
            <button
              type="button"
              onClick={addAction}
              className="rounded bg-slate-700 px-3 py-1.5 text-xs text-slate-100"
            >
              + Add action
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void analyzeSmart()}
              disabled={analyzing}
              className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {analyzing ? "Đang phân tích..." : "Smart Analyze"}
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Gửi tạo test (draft)"}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100"
            >
              Clear all
            </button>
          </div>
          <Link href="/editor" className="block text-sm text-emerald-400 hover:underline">
            → Chỉnh sửa nâng cao
          </Link>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <h2 className="text-sm font-medium text-slate-200">Kết quả hiển thị</h2>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-400">Actions hiện tại ({actions.length})</div>
              <button
                type="button"
                onClick={() => void copyText("actions JSON", JSON.stringify(actions, null, 2))}
                className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200"
              >
                Copy JSON
              </button>
            </div>
            <pre className="rounded bg-slate-900 border border-slate-800 p-3 text-xs overflow-auto min-h-[180px]">
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
                className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40"
              >
                Copy
              </button>
            </div>
            <pre className="rounded bg-slate-900 border border-indigo-700 p-3 text-xs overflow-auto min-h-[120px]">
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
                className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40"
              >
                Copy
              </button>
            </div>
            <pre className="rounded bg-slate-900 border border-slate-800 p-3 text-xs overflow-auto min-h-[120px]">
              {result || "Chưa có dữ liệu. Hãy bấm Gửi tạo test (draft)."}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
