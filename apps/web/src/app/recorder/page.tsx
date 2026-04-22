"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";

type ActionType = "navigate" | "click" | "fill" | "assertText";
type DraftAction = { type: ActionType; selector?: string; value?: string; expected?: string };
const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

export default function RecorderPage() {
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

  function addAction() {
    setActions((prev) => [
      ...prev,
      {
        type: actionType,
        selector: selector || undefined,
        value: value || undefined,
        expected: expected || undefined,
      },
    ]);
  }

  async function analyzeSmart() {
    setSmartPreview(null);
    const res = await fetch(`${getApiBase()}/projects/${encodeURIComponent(projectId)}/tests/smart-record`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({
        url,
        actions: [{ type: "navigate" as const, selector: "body" }, ...actions],
      }),
    });
    const text = await res.text();
    setSmartPreview(`${res.status} ${text}`);
  }

  async function submit() {
    setResult(null);
    const res = await fetch(`${getApiBase()}/projects/${encodeURIComponent(projectId)}/tests`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({
        name,
        platform: "desktop-web",
        steps: actions
          .filter((a) => a.type === "click" && a.selector)
          .map((a) => ({ kind: "recorded.click", selector: a.selector })),
      }),
    });
    const text = await res.text();
    setResult(`${res.status} ${text}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-emerald-400">Smart URL Recorder (v1)</h1>
      <p className="text-slate-400 text-sm">
        Nhập URL, thêm các hành động, chạy smart analyze để nhận gợi ý selector/assert, rồi lưu draft test case.
      </p>
      <label className="block">
        <span className="text-sm text-slate-400">Project ID</span>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
          maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
        />
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
      <pre className="rounded bg-slate-900 border border-slate-800 p-3 text-xs overflow-auto">
        {JSON.stringify(actions, null, 2)}
      </pre>
      <button
        type="button"
        onClick={() => void analyzeSmart()}
        className="rounded bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
      >
        Smart Analyze
      </button>
      {smartPreview && (
        <pre className="rounded bg-slate-900 border border-indigo-700 p-3 text-xs overflow-auto">{smartPreview}</pre>
      )}
      <button
        type="button"
        onClick={() => void submit()}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950"
      >
        Gửi tạo test (draft)
      </button>
      {result && (
        <pre className="rounded bg-slate-900 border border-slate-800 p-3 text-xs overflow-auto">{result}</pre>
      )}
      <Link href="/editor" className="block text-sm text-emerald-400 hover:underline">
        → Chỉnh sửa nâng cao
      </Link>
    </div>
  );
}
