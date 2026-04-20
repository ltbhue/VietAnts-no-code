"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";

export default function RecorderPage() {
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("Kịch bản ghi mới");
  const [selector, setSelector] = useState("[data-test='submit']");
  const [result, setResult] = useState<string | null>(null);

  async function submit() {
    setResult(null);
    const res = await fetch(`${getApiBase()}/projects/${encodeURIComponent(projectId)}/tests`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({
        name,
        platform: "desktop-web",
        steps: [{ kind: "recorded.click", selector }],
      }),
    });
    const text = await res.text();
    setResult(`${res.status} ${text}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-emerald-400">Ghi thao tác (Recorder)</h1>
      <p className="text-slate-400 text-sm">
        Nhập tạm project ID và một bước click để kiểm tra API tạo test (MVP). Luồng ghi trình duyệt thật sẽ bổ sung sau.
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
        <span className="text-sm text-slate-400">Tên test</span>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm text-slate-400">Selector (recorded.click)</span>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
        />
      </label>
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
