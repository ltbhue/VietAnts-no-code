"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";

export default function EditorPage() {
  const [projectId, setProjectId] = useState("");
  const [testCaseId, setTestCaseId] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function publish() {
    setResult(null);
    const res = await fetch(
      `${getApiBase()}/projects/${encodeURIComponent(projectId)}/tests/${encodeURIComponent(testCaseId)}/publish`,
      { method: "POST", headers: authJsonHeaders() },
    );
    const text = await res.text();
    setResult(`${res.status} ${text}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-emerald-400">Biên tập & publish</h1>
      <p className="text-slate-400 text-sm">
        Nhập project và test case ID để gọi publish API (validation nghiệp vụ trước khi Published).
      </p>
      <label className="block">
        <span className="text-sm text-slate-400">Project ID</span>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm text-slate-400">Test case ID</span>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={testCaseId}
          onChange={(e) => setTestCaseId(e.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={() => void publish()}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950"
      >
        Publish test
      </button>
      {result && (
        <pre className="rounded bg-slate-900 border border-slate-800 p-3 text-xs overflow-auto">{result}</pre>
      )}
      <Link href="/suite-runs" className="block text-sm text-emerald-400 hover:underline">
        → Chạy suite
      </Link>
    </div>
  );
}
