"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { downloadRunPdf, getApiBase } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ui } from "@/lib/ui";

interface ScriptRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  scriptId?: string;
  script: {
    id?: string;
    name: string;
  };
}

interface SuiteRun {
  id: string;
  suiteId: string;
  status: string;
  startedAt: string;
  finishedAt?: string | null;
  environment?: string | null;
  results?: SuiteCaseResult[] | null;
  suite: {
    id: string;
    name: string;
    projectId: string;
    project: { id: string; name: string };
  };
}

interface SuiteCaseResult {
  testCaseId: string;
  testCaseVersionId: string;
  status: string;
  stepLog: Array<{ step: number; message: string }>;
  screenshotUrl?: string;
}

interface RunDetail extends ScriptRun {
  results?: Array<{
    id: string;
    stepOrder: number;
    status: string;
    message?: string | null;
    screenshot?: string | null;
  }>;
  stepMeta?: Array<{
    order: number;
    keyword: string;
    targetId?: string | null;
  }>;
  objectMap?: Array<{
    id: string;
    name: string;
    locator: string;
  }>;
}

type ReportKind = "all" | "script" | "suite";

type ReportRow =
  | {
      kind: "script";
      id: string;
      name: string;
      projectName: string;
      startedAt: string;
      finishedAt?: string;
      status: string;
    }
  | {
      kind: "suite";
      id: string;
      suiteId: string;
      name: string;
      projectName: string;
      startedAt: string;
      finishedAt?: string | null;
      status: string;
    };

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

function viStatus(status: string): string {
  if (status === "passed" || status === "completed") return "Thành công";
  if (status === "failed") return "Thất bại";
  if (status === "queued") return "Đang chờ";
  if (status === "running") return "Đang chạy";
  return status;
}

function normalizeStatus(status: string): "passed" | "failed" | "other" {
  if (status === "passed" || status === "completed") return "passed";
  if (status === "failed") return "failed";
  return "other";
}

function ReportsPageInner() {
  const searchParams = useSearchParams();
  const highlightRunId = searchParams.get("runId");

  const [scriptRuns, setScriptRuns] = useState<ScriptRun[]>([]);
  const [suiteRuns, setSuiteRuns] = useState<SuiteRun[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedKind, setSelectedKind] = useState<ReportKind>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [scriptDetail, setScriptDetail] = useState<RunDetail | null>(null);
  const [suiteDetail, setSuiteDetail] = useState<SuiteRun | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const apiBase = getApiBase();
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const load = useCallback(async () => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.set("status", selectedStatus);
      const query = params.toString() ? `?${params.toString()}` : "";
      const [scriptRes, suiteRes] = await Promise.all([
        axios.get<ScriptRun[]>(`${apiBase}/runs${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<SuiteRun[]>(`${apiBase}/suites/runs${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setScriptRuns(scriptRes.data);
      setSuiteRuns(suiteRes.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải được dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  }, [apiBase, selectedStatus, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!highlightRunId || loading) return;
    const suite = suiteRuns.find((r) => r.id === highlightRunId);
    if (suite) {
      queueMicrotask(() => {
        setSuiteDetail(suite);
        setNotice(`Đang xem kết quả suite «${suite.suite.name}».`);
      });
    }
  }, [highlightRunId, loading, suiteRuns]);

  const rows = useMemo<ReportRow[]>(() => {
    const scriptRows: ReportRow[] = scriptRuns.map((r) => ({
      kind: "script",
      id: r.id,
      name: r.script?.name ?? "Kịch bản",
      projectName: "—",
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      status: r.status,
    }));
    const suiteRows: ReportRow[] = suiteRuns.map((r) => ({
      kind: "suite",
      id: r.id,
      suiteId: r.suiteId,
      name: r.suite?.name ?? "Suite",
      projectName: r.suite?.project?.name ?? "—",
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      status: r.status,
    }));
    return [...scriptRows, ...suiteRows].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }, [scriptRuns, suiteRuns]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (selectedKind !== "all" && row.kind !== selectedKind) return false;
      if (!keyword) return true;
      return (
        row.name.toLowerCase().includes(keyword) ||
        row.projectName.toLowerCase().includes(keyword) ||
        row.id.toLowerCase().includes(keyword) ||
        (row.kind === "suite" && row.suiteId.toLowerCase().includes(keyword))
      );
    });
  }, [rows, search, selectedKind]);

  const total = filteredRows.length;
  const passed = filteredRows.filter((r) => normalizeStatus(r.status) === "passed").length;
  const failed = filteredRows.filter((r) => normalizeStatus(r.status) === "failed").length;

  async function loadScriptDetail(id: string) {
    if (!token) return;
    setDetailLoading(true);
    setSuiteDetail(null);
    setError(null);
    try {
      const res = await axios.get<RunDetail>(`${apiBase}/runs/${id}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScriptDetail(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải chi tiết kịch bản");
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadSuiteDetail(row: Extract<ReportRow, { kind: "suite" }>) {
    if (!token) return;
    setDetailLoading(true);
    setScriptDetail(null);
    setError(null);
    try {
      const res = await axios.get<SuiteRun>(
        `${apiBase}/suites/${encodeURIComponent(row.suiteId)}/runs/${encodeURIComponent(row.id)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuiteDetail(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải chi tiết suite");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handlePdf(runId: string) {
    setPdfLoading(runId);
    setError(null);
    try {
      await downloadRunPdf(runId);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e?.message ?? "Không tải được PDF");
    } finally {
      setPdfLoading(null);
    }
  }

  function getScreenshotUrl(screenshotPath: string): string {
    if (/^https?:\/\//i.test(screenshotPath)) return screenshotPath;
    const normalized = screenshotPath.startsWith("/") ? screenshotPath : `/${screenshotPath}`;
    return `${apiBase}${normalized}`;
  }

  function closeDetail() {
    setScriptDetail(null);
    setSuiteDetail(null);
  }

  return (
    <main className={ui.content}>
      <div className={ui.wide}>
        <PageHeader
          title="Báo cáo"
          subtitle="Lịch sử chạy kịch bản và bộ kiểm thử (suite). Xem chi tiết từng lần chạy sau khi thực thi."
          actions={
            <button type="button" onClick={() => void load()} className={ui.btnSecondary}>
              Làm mới
            </button>
          }
        />

        {loading && <p className="text-sm text-slate-400">Đang tải…</p>}
        {error && <p className={`${ui.alertError} mb-4`}>{error}</p>}
        {notice && <p className={`${ui.alertOk} mb-4`}>{notice}</p>}

        <section className="grid gap-4 md:grid-cols-3 mb-6 text-sm">
          <div className={ui.statCard}>
            <div className="text-slate-400 mb-1">Tổng số lần chạy</div>
            <div className="text-2xl font-semibold">{total}</div>
          </div>
          <div className={ui.statCard}>
            <div className="text-slate-400 mb-1">Thành công</div>
            <div className="text-2xl font-semibold text-emerald-400">{passed}</div>
          </div>
          <div className={ui.statCard}>
            <div className="text-slate-400 mb-1">Thất bại</div>
            <div className="text-2xl font-semibold text-red-400">{failed}</div>
          </div>
        </section>

        <section className={`${ui.card} mb-6`}>
          <p className={`${ui.sectionTitle} mb-3`}>Bộ lọc báo cáo</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className={ui.label}>Loại</label>
              <select
                className={ui.select}
                value={selectedKind}
                onChange={(e) => setSelectedKind(e.target.value as ReportKind)}
              >
                <option value="all">Tất cả</option>
                <option value="script">Kịch bản</option>
                <option value="suite">Bộ kiểm thử</option>
              </select>
            </div>
            <div>
              <label className={ui.label}>Trạng thái</label>
              <select className={ui.select} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="passed">Thành công</option>
                <option value="failed">Thất bại</option>
                <option value="running">Đang chạy</option>
              </select>
            </div>
            <div>
              <label className={ui.label}>Tìm kiếm</label>
              <input
                className={ui.input}
                value={search}
                onChange={(e) => setSearch(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                placeholder="Tên, dự án, Run ID…"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedStatus("");
                setSelectedKind("all");
                setSearch("");
              }}
              className={ui.btnSecondary}
            >
              Đặt lại
            </button>
          </div>
        </section>

        <section className={`${ui.card} text-sm`}>
          <p className={`${ui.sectionTitle} mb-4`}>Lần chạy gần đây</p>
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>Loại</th>
                  <th className={ui.th}>Tên</th>
                  <th className={ui.th}>Dự án</th>
                  <th className={ui.th}>Bắt đầu</th>
                  <th className={ui.th}>Kết thúc</th>
                  <th className={ui.th}>Trạng thái</th>
                  <th className={ui.th}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr
                    key={`${r.kind}-${r.id}`}
                    className={`${ui.tr} ${highlightRunId === r.id ? "bg-emerald-950/25" : ""}`}
                  >
                    <td className={ui.td}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          r.kind === "suite"
                            ? "bg-indigo-900/50 text-indigo-200"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {r.kind === "suite" ? "Suite" : "Kịch bản"}
                      </span>
                    </td>
                    <td className={`${ui.td} font-medium text-white`}>{r.name}</td>
                    <td className={`${ui.td} text-slate-300`}>{r.projectName}</td>
                    <td className={`${ui.td} whitespace-nowrap text-slate-300`}>
                      {new Date(r.startedAt).toLocaleString("vi-VN")}
                    </td>
                    <td className={`${ui.td} whitespace-nowrap text-slate-300`}>
                      {r.finishedAt ? new Date(r.finishedAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className={ui.td}>
                      <span
                        className={
                          normalizeStatus(r.status) === "passed"
                            ? "text-emerald-400"
                            : normalizeStatus(r.status) === "failed"
                              ? "text-red-400"
                              : "text-slate-200"
                        }
                      >
                        {viStatus(r.status)}
                      </span>
                    </td>
                    <td className={ui.td}>
                      <div className="flex flex-wrap gap-2">
                        {r.kind === "script" && (
                          <button
                            type="button"
                            disabled={pdfLoading === r.id}
                            onClick={() => handlePdf(r.id)}
                            className={`${ui.btnSm} text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-50`}
                          >
                            {pdfLoading === r.id ? "Đang tải…" : "Tải PDF"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            r.kind === "script" ? void loadScriptDetail(r.id) : void loadSuiteDetail(r)
                          }
                          className={`${ui.btnSm} text-slate-300 hover:bg-slate-800`}
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className={`${ui.td} text-slate-300`}>
                      Chưa có lần chạy. Chạy tại{" "}
                      <Link href="/scripts" className="text-emerald-400 hover:underline">
                        Kịch bản
                      </Link>{" "}
                      hoặc{" "}
                      <Link href="/suite-runs" className="text-emerald-400 hover:underline">
                        Bộ kiểm thử
                      </Link>
                      .
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {(scriptDetail || suiteDetail || detailLoading) && (
        <div className={ui.modalOverlay}>
          <div className="max-w-2xl w-full max-h-[85vh] overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50">
            <div className="flex justify-between items-start gap-2 mb-4">
              <h3 className="text-lg font-semibold text-white">
                {suiteDetail ? "Chi tiết chạy suite" : "Chi tiết chạy kịch bản"}
              </h3>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white text-xl leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            {detailLoading && <p className="text-sm text-slate-400">Đang tải…</p>}

            {scriptDetail && !detailLoading && (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="text-slate-500">ID:</span> {scriptDetail.id}
                </p>
                <p>
                  <span className="text-slate-500">Kịch bản:</span> {scriptDetail.script?.name}
                </p>
                <p>
                  <span className="text-slate-500">Trạng thái:</span> {viStatus(scriptDetail.status)}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={pdfLoading === scriptDetail.id}
                    onClick={() => handlePdf(scriptDetail.id)}
                    className={`${ui.btnSm} text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-50`}
                  >
                    {pdfLoading === scriptDetail.id ? "Đang tải PDF…" : "Tải PDF báo cáo"}
                  </button>
                </div>
                <div className="border-t border-slate-800 pt-2 mt-2">
                  <div className="text-slate-400 mb-1">Kết quả từng bước</div>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {(scriptDetail.results ?? []).map((x) => (
                      <li key={x.id} className="border-b border-slate-800/80 pb-1">
                        Bước {x.stepOrder}:{" "}
                        <span className={x.status === "passed" ? "text-emerald-400" : "text-red-400"}>
                          {viStatus(x.status)}
                        </span>
                        {x.message && <span className="text-slate-400"> — {x.message}</span>}
                        {x.screenshot && (
                          <div className="mt-2">
                            <img
                              src={getScreenshotUrl(x.screenshot)}
                              alt={`Screenshot bước ${x.stepOrder}`}
                              className="max-h-64 w-auto rounded-md border border-slate-700 bg-slate-950"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {suiteDetail && !detailLoading && (
              <div className="space-y-2 text-xs">
                <p>
                  <span className="text-slate-500">Run ID:</span> {suiteDetail.id}
                </p>
                <p>
                  <span className="text-slate-500">Suite:</span> {suiteDetail.suite?.name}
                </p>
                <p>
                  <span className="text-slate-500">Suite ID:</span> {suiteDetail.suiteId}
                </p>
                <p>
                  <span className="text-slate-500">Trạng thái:</span> {viStatus(suiteDetail.status)}
                </p>
                <div className="border-t border-slate-800 pt-2 mt-2">
                  <div className="text-slate-400 mb-1">Kết quả từng test case</div>
                  <ul className="space-y-2 font-mono text-[11px]">
                    {(Array.isArray(suiteDetail.results) ? suiteDetail.results : []).map((item, idx) => (
                      <li key={`${item.testCaseVersionId}-${idx}`} className="rounded border border-slate-800 p-2">
                        <div>
                          Test case {item.testCaseId}:{" "}
                          <span className={item.status === "passed" ? "text-emerald-400" : "text-red-400"}>
                            {viStatus(item.status)}
                          </span>
                        </div>
                        <ul className="mt-1 space-y-0.5 text-slate-400">
                          {item.stepLog.map((step) => (
                            <li key={step.step}>
                              Bước {step.step}: {step.message}
                            </li>
                          ))}
                        </ul>
                        {item.screenshotUrl && (
                          <img
                            src={getScreenshotUrl(item.screenshotUrl)}
                            alt="Screenshot lỗi suite"
                            className="mt-2 max-h-64 w-auto rounded-md border border-slate-700 bg-slate-950"
                            loading="lazy"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải…</main>}>
      <ReportsPageInner />
    </Suspense>
  );
}
