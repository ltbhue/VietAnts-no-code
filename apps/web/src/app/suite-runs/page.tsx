"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";

export default function SuiteRunsPage() {
  const [suiteId, setSuiteId] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function runSuite() {
    setResult(null);
    const res = await fetch(`${getApiBase()}/suites/${encodeURIComponent(suiteId)}/runs`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({ environment: "staging" }),
    });
    const text = await res.text();
    setResult(`${res.status} ${text}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-emerald-400">Chạy suite</h1>
      <p className="text-slate-400 text-sm">
        Nhập Suite ID để trigger chạy (MVP). Kết quả chi tiết xem trong báo cáo run.
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
        onClick={() => void runSuite()}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950"
      >
        Chạy suite
      </button>
      {result && (
        <pre className="rounded bg-slate-900 border border-slate-800 p-3 text-xs overflow-auto">{result}</pre>
      )}
      <Link href="/reports" className="block text-sm text-emerald-400 hover:underline">
        → Báo cáo (runs cũ)
      </Link>
    </div>
  );
}
