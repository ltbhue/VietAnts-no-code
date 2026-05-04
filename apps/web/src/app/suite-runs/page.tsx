"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { FiPlay } from "react-icons/fi";

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
    <main className={ui.content}>
      <div className={ui.narrow}>
        <PageHeader
          title="Chạy suite"
          subtitle="Nhập Suite ID để gọi API chạy (MVP). Kết quả chi tiết xem trong module Báo cáo."
        />

        <section className={`${ui.card} space-y-4`}>
          <div>
            <label className={ui.label} htmlFor="suite-id">
              Suite ID
            </label>
            <input
              id="suite-id"
              className={ui.input}
              value={suiteId}
              onChange={(e) => setSuiteId(e.target.value)}
              placeholder="Dán ID suite…"
            />
          </div>
          <button type="button" onClick={() => void runSuite()} className={`${ui.btnPrimary} gap-2`}>
            <FiPlay className="h-4 w-4" aria-hidden />
            Chạy suite
          </button>
          {result && <pre className={ui.pre}>{result}</pre>}
          <Link href="/reports" className={ui.link}>
            → Mở báo cáo runs
          </Link>
        </section>
      </div>
    </main>
  );
}
