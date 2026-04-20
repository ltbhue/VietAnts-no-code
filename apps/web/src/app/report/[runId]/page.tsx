"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";

export default function ReportDetailPage() {
  const params = useParams();
  const runId = typeof params.runId === "string" ? params.runId : "";
  const [suiteId, setSuiteId] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function load() {
    setResult(null);
    if (!suiteId) {
      setResult("Nhập suite ID để tải báo cáo chạy.");
      return;
    }
    const res = await fetch(
      `${getApiBase()}/suites/${encodeURIComponent(suiteId)}/runs/${encodeURIComponent(runId)}`,
      { headers: authJsonHeaders() },
    );
    const text = await res.text();
    setResult(`${res.status} ${text}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-emerald-400">Báo cáo run</h1>
      <p className="text-slate-400 text-sm">
        Run ID: <code className="text-emerald-300">{runId || "—"}</code>. Mỗi case fail cần có screenshot + step log ở API (MVP lưu trong JSON results).
      </p>
      <label className="block">
        <span className="text-sm text-slate-400">Suite ID</span>
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={suiteId}
          onChange={(e) => setSuiteId(e.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={() => void load()}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950"
      >
        Tải báo cáo
      </button>
      {result && (
        <pre className="rounded bg-slate-900 border border-slate-800 p-3 text-xs overflow-auto">{result}</pre>
      )}
      <Link href="/suite-runs" className="block text-sm text-emerald-400 hover:underline">
        ← Quay lại chạy suite
      </Link>
    </div>
  );
}
