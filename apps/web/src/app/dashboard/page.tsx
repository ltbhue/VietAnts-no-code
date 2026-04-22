"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { getApiBase } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  description?: string | null;
}
interface RunSummary {
  id: string;
  status: string;
}
interface SuiteSummary {
  id: string;
  name: string;
}
interface AnalyticsSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  commonErrors: Array<{ message: string; count: number }>;
  timeSeries?: Array<{ date: string; passed: number; failed: number }>;
  statusBreakdown?: Array<{ label: string; value: number }>;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [suites, setSuites] = useState<SuiteSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBase = getApiBase();

  const load = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setError(null);
    try {
      const res = await axios.get<Project[]>(`${apiBase}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
      const defaultProjectId = selectedProjectId || res.data[0]?.id || "";
      if (!selectedProjectId && defaultProjectId) {
        setSelectedProjectId(defaultProjectId);
      }
      const runRes = await axios.get<RunSummary[]>(`${apiBase}/runs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRuns(runRes.data);
      if (defaultProjectId) {
        const suiteRes = await axios.get<SuiteSummary[]>(`${apiBase}/projects/${defaultProjectId}/suites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuites(suiteRes.data);
        if (selectedSuiteId && !suiteRes.data.some((s) => s.id === selectedSuiteId)) {
          setSelectedSuiteId("");
        }
      } else {
        setSuites([]);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải được danh sách project");
    } finally {
      setLoading(false);
    }
  }, [apiBase, selectedProjectId, selectedSuiteId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const params = new URLSearchParams();
    params.set("days", String(rangeDays));
    if (selectedProjectId) params.set("projectId", selectedProjectId);
    if (selectedSuiteId) params.set("suiteId", selectedSuiteId);
    axios
      .get<AnalyticsSummary>(`${apiBase}/runs/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(null));
  }, [apiBase, rangeDays, selectedProjectId, selectedSuiteId]);

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-300 mt-1">
          Theo dõi số liệu kiểm thử tổng quan theo project và suite.
        </p>
        <Link
          href="/projects"
          className="inline-flex mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500"
        >
          Đi tới module Project
        </Link>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 mb-8">
        <h2 className="text-sm font-medium text-slate-200 mb-3">Thống kê kiểm thử</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value) as 7 | 30)}
          >
            <option value={7}>7 ngày gần nhất</option>
            <option value={30}>30 ngày gần nhất</option>
          </select>
          <select
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedSuiteId("");
            }}
          >
            <option value="">Tất cả project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={selectedSuiteId}
            onChange={(e) => setSelectedSuiteId(e.target.value)}
          >
            <option value="">Tất cả suite</option>
            {suites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setRangeDays(7);
              setSelectedProjectId("");
              setSelectedSuiteId("");
            }}
            className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-2 text-sm"
          >
            Reset filter
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded border border-slate-800 bg-slate-950 p-3">
            <div className="text-slate-400">Tổng số run</div>
            <div className="text-xl font-semibold">{runs.length}</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950 p-3">
            <div className="text-slate-400">Pass</div>
            <div className="text-xl font-semibold text-emerald-400">
              {analytics?.passed ?? runs.filter((r) => r.status === "passed" || r.status === "completed").length}
            </div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950 p-3">
            <div className="text-slate-400">Fail</div>
            <div className="text-xl font-semibold text-red-400">
              {analytics?.failed ?? runs.filter((r) => r.status === "failed").length}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded border border-slate-800 bg-slate-950 p-4">
            <div className="text-sm font-medium mb-3">Biểu đồ Pass/Fail</div>
            {(() => {
              const pass = analytics?.passed ?? runs.filter((r) => r.status === "passed" || r.status === "completed").length;
              const fail = analytics?.failed ?? runs.filter((r) => r.status === "failed").length;
              const max = Math.max(pass, fail, 1);
              const passHeight = Math.max((pass / max) * 140, pass > 0 ? 8 : 0);
              const failHeight = Math.max((fail / max) * 140, fail > 0 ? 8 : 0);
              return (
                <div className="h-48 flex items-end gap-8 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 rounded-t bg-emerald-500/80 transition-all duration-500"
                      style={{ height: `${passHeight}px` }}
                    />
                    <div className="text-xs text-slate-300">Pass ({pass})</div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 rounded-t bg-red-500/80 transition-all duration-500"
                      style={{ height: `${failHeight}px` }}
                    />
                    <div className="text-xs text-slate-300">Fail ({fail})</div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="rounded border border-slate-800 bg-slate-950 p-4">
            <div className="text-sm font-medium mb-3">Tỉ lệ pass</div>
            <div className="w-full h-5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(analytics?.passRate ?? 0, 100))}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-emerald-300 font-medium">{analytics?.passRate ?? 0}%</div>
            <p className="mt-3 text-xs text-slate-400">
              Biểu đồ cập nhật theo dữ liệu API `runs/analytics`.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded border border-slate-800 bg-slate-950 p-4">
            <div className="text-sm font-medium mb-3">Biểu đồ đường theo thời gian</div>
            {(() => {
              const points = analytics?.timeSeries ?? [];
              if (points.length === 0) {
                return <div className="text-xs text-slate-400">Chưa có dữ liệu trong khoảng thời gian đã chọn.</div>;
              }
              const maxY = Math.max(
                1,
                ...points.map((p) => Math.max(p.passed, p.failed)),
              );
              const w = 360;
              const h = 180;
              const pad = 20;
              const toX = (i: number) =>
                pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
              const toY = (v: number) => h - pad - (v * (h - pad * 2)) / maxY;
              const passPath = points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.passed)}`)
                .join(" ");
              const failPath = points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.failed)}`)
                .join(" ");
              return (
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-52">
                  <path d={passPath} fill="none" stroke="#10b981" strokeWidth="3" />
                  <path d={failPath} fill="none" stroke="#ef4444" strokeWidth="3" />
                </svg>
              );
            })()}
            <div className="mt-2 text-xs text-slate-400">Xanh: Pass, Đỏ: Fail</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950 p-4">
            <div className="text-sm font-medium mb-3">Donut chart Pass/Fail</div>
            {(() => {
              const pass = analytics?.passed ?? 0;
              const fail = analytics?.failed ?? 0;
              const total = Math.max(pass + fail, 1);
              const passDeg = (pass / total) * 360;
              return (
                <div className="flex items-center gap-6">
                  <div
                    className="w-36 h-36 rounded-full"
                    style={{
                      background: `conic-gradient(#10b981 0deg ${passDeg}deg, #ef4444 ${passDeg}deg 360deg)`,
                    }}
                  >
                    <div className="w-20 h-20 rounded-full bg-slate-950 m-auto mt-8 flex items-center justify-center text-xs text-slate-300">
                      {analytics?.passRate ?? 0}%
                    </div>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="text-emerald-300">Pass: {pass}</div>
                    <div className="text-red-300">Fail: {fail}</div>
                    <div className="text-slate-400">Tổng: {pass + fail}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-2">
            Tỉ lệ pass: <span className="text-emerald-300">{analytics?.passRate ?? 0}%</span>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950 p-3">
            <div className="text-sm font-medium mb-2">Các lỗi phổ biến</div>
            {(analytics?.commonErrors ?? []).length === 0 ? (
              <div className="text-xs text-slate-400">Chưa có lỗi.</div>
            ) : (
              <ul className="space-y-1 text-xs">
                {(analytics?.commonErrors ?? []).map((item) => (
                  <li key={item.message} className="flex justify-between gap-3">
                    <span className="text-slate-300 truncate">{item.message}</span>
                    <span className="text-red-300">x{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {loading && <p className="text-sm text-slate-300">Đang tải...</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
    </main>
  );
}
