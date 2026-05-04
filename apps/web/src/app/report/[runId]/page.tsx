"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { FiDownload } from "react-icons/fi";

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
    <main className={ui.content}>
      <div className={ui.narrow}>
        <PageHeader
          title="Báo cáo run"
          subtitle={`Run ID: ${runId || "—"}. Phản hồi thô từ API (MVP).`}
        />

        <section className={`${ui.card} space-y-4`}>
          <div>
            <label className={ui.label} htmlFor="rep-suite">
              Suite ID
            </label>
            <input
              id="rep-suite"
              className={`${ui.input} font-mono text-xs`}
              value={suiteId}
              onChange={(e) => setSuiteId(e.target.value)}
            />
          </div>
          <button type="button" onClick={() => void load()} className={`${ui.btnPrimary} gap-2`}>
            <FiDownload className="h-4 w-4" aria-hidden />
            Tải báo cáo
          </button>
          {result && <pre className={ui.pre}>{result}</pre>}
          <Link href="/suite-runs" className={ui.link}>
            ← Quay lại chạy suite
          </Link>
        </section>
      </div>
    </main>
  );
}
