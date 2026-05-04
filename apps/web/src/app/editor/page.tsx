"use client";

import Link from "next/link";
import { getApiBase, authJsonHeaders } from "@/lib/api";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";
import { FiSend } from "react-icons/fi";

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
    <main className={ui.content}>
      <div className={ui.narrow}>
        <PageHeader
          title="Biên tập & publish"
          subtitle="Nhập project ID và test case ID để gọi API publish (kiểm tra nghiệp vụ trước khi Published)."
        />

        <section className={`${ui.card} space-y-4`}>
          <div>
            <label className={ui.label} htmlFor="ed-project">
              Project ID
            </label>
            <input
              id="ed-project"
              className={`${ui.input} font-mono text-xs`}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <div>
            <label className={ui.label} htmlFor="ed-case">
              Test case ID
            </label>
            <input
              id="ed-case"
              className={`${ui.input} font-mono text-xs`}
              value={testCaseId}
              onChange={(e) => setTestCaseId(e.target.value)}
            />
          </div>
          <button type="button" onClick={() => void publish()} className={`${ui.btnPrimary} gap-2`}>
            <FiSend className="h-4 w-4" aria-hidden />
            Publish test
          </button>
          {result && <pre className={ui.pre}>{result}</pre>}
          <Link href="/suite-runs" className={ui.link}>
            → Chạy suite
          </Link>
        </section>
      </div>
    </main>
  );
}
