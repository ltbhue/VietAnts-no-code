"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RecorderWorkspace } from "@/components/RecorderWorkspace";

function RecorderEditPageInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const testCaseId = searchParams.get("testCaseId") ?? "";

  if (!projectId.trim() || !testCaseId.trim()) {
    return (
      <main className="p-8">
        <p className="text-red-200">Thiếu projectId hoặc testCaseId. Mở trang chỉnh sửa từ danh sách ghi thao tác.</p>
      </main>
    );
  }

  return (
    <RecorderWorkspace mode="edit" initialProjectId={projectId} initialTestCaseId={testCaseId} />
  );
}

export default function RecorderEditPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải…</main>}>
      <RecorderEditPageInner />
    </Suspense>
  );
}
