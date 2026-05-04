"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowUp,
  FiCheckCircle,
  FiEdit3,
  FiGlobe,
  FiLayers,
  FiLoader,
  FiMinusCircle,
  FiMousePointer,
  FiPlay,
  FiPlus,
  FiSave,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { canMutateNoCode, getApiBase, getUserRole } from "@/lib/api";

interface ScriptDetail {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  steps: Step[];
}

interface Step {
  id?: string;
  order: number;
  keyword: string;
  targetId?: string | null;
  parameters?: unknown;
}

interface DataSet {
  id: string;
  name: string;
  projectId: string;
}

type StepKeyword = "navigate" | "click" | "fill" | "assertText";

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;
/** Thời gian chờ một bước (ms): trùng validation API & Playwright. Để trống = ~30s mặc định. */
const MIN_STEP_TIMEOUT_MS = 1000;
const MAX_STEP_TIMEOUT_MS = 180_000;

const KEYWORD_CARDS: {
  id: StepKeyword;
  label: string;
  hint: string;
  Icon: typeof FiGlobe;
}[] = [
  { id: "navigate", label: "Mở trang", hint: "Đi tới một URL", Icon: FiGlobe },
  { id: "click", label: "Bấm / chọn", hint: "Click phần tử theo selector", Icon: FiMousePointer },
  { id: "fill", label: "Điền ô", hint: "Nhập chữ vào input", Icon: FiEdit3 },
  { id: "assertText", label: "Kiểm tra chữ", hint: "Đối chiếu nội dung hiển thị", Icon: FiCheckCircle },
];

function keywordLabel(kw: string): string {
  return KEYWORD_CARDS.find((c) => c.id === kw)?.label ?? kw;
}

/** Một bước (theo `order`) sau lần chạy gần nhất: đang chờ / đạt / lỗi / chưa chạy tới */
type RunStepVisual = "pending" | "passed" | "failed" | "none";

interface TestRunResultDto {
  stepOrder: number;
  status: string;
  message?: string | null;
}

interface TestRunResponseDto {
  id?: string;
  status?: string;
  results?: TestRunResultDto[];
}

function aggregateStepResults(results: TestRunResultDto[]): Map<number, "passed" | "failed"> {
  const failedOrders = new Set<number>();
  const passedOrders = new Set<number>();
  for (const r of results) {
    const st = String(r.status ?? "").toLowerCase();
    if (st === "failed") failedOrders.add(r.stepOrder);
    else if (st === "passed") passedOrders.add(r.stepOrder);
  }
  const out = new Map<number, "passed" | "failed">();
  for (const o of failedOrders) out.set(o, "failed");
  for (const o of passedOrders) {
    if (!out.has(o)) out.set(o, "passed");
  }
  return out;
}

/** Theo thứ tự API trả về; bước trùng `stepOrder` (nhiều vòng dataset) lấy bản ghi fail sau cùng. */
function failureDetailByStepOrder(results: TestRunResultDto[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const r of results) {
    if (String(r.status ?? "").toLowerCase() !== "failed") continue;
    const raw = typeof r.message === "string" ? r.message.trim() : "";
    const line = raw.replace(/\s+/g, " ").slice(0, 2000);
    map.set(r.stepOrder, line || "Lỗi không có chi tiết từ máy chủ.");
  }
  return map;
}

function tooltipForFailure(stepLabel: string, detail?: string): string {
  if (!detail) return `${stepLabel} — lỗi`;
  return `${stepLabel} — ${detail}`;
}

/** Vòng bên trái: thay số bằng icon khi có kết quả chạy; chưa chạy thì hiển thị số thứ tự trong vòng trung tính. */
function StepTimelineBadge({
  status,
  stepNumber,
  failureDetail,
}: {
  status: RunStepVisual | undefined;
  stepNumber: number;
  failureDetail?: string | null;
}) {
  const ring = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border";
  const label = `Bước ${stepNumber}`;

  if (status === "passed") {
    return (
      <div className={`${ring} border-emerald-500/70 bg-emerald-950/50`} title={`${label} — đạt`} aria-label={`${label} đạt`}>
        <FiCheckCircle className="w-[22px] h-[22px] text-emerald-400" aria-hidden />
      </div>
    );
  }
  if (status === "failed") {
    const tip = tooltipForFailure(label, failureDetail ?? undefined);
    return (
      <div className={`${ring} cursor-help border-red-500/60 bg-red-950/40`} title={tip} aria-label={tip}>
        <FiXCircle className="w-[22px] h-[22px] text-red-400" aria-hidden />
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className={`${ring} border-slate-700 bg-slate-900`} title={`${label} — đang chạy`} aria-label={`${label} đang chạy`}>
        <FiLoader className="w-5 h-5 text-slate-500 animate-spin" aria-hidden />
      </div>
    );
  }
  if (status === "none") {
    return (
      <div
        className={`${ring} border-slate-700 bg-slate-900/80`}
        title={`${label} — chưa chạy tới`}
        aria-label={`${label} chưa chạy tới`}
      >
        <FiMinusCircle className="w-[22px] h-[22px] text-slate-400" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={`${ring} border-slate-700 bg-slate-900 text-xs font-bold text-slate-400`}
      title={label}
      aria-label={label}
    >
      {stepNumber}
    </div>
  );
}

export default function ScriptDetailPage() {
  const params = useParams<{ id: string }>();
  const scriptId = params.id;
  const apiBase = getApiBase();

  const [script, setScript] = useState<ScriptDetail | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [dirty, setDirty] = useState(false);
  const [datasets, setDatasets] = useState<DataSet[]>([]);
  const [runDatasetId, setRunDatasetId] = useState("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftKeyword, setDraftKeyword] = useState<StepKeyword>("navigate");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftSelector, setDraftSelector] = useState("");
  const [draftExpected, setDraftExpected] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftDataKey, setDraftDataKey] = useState("");
  const [draftTimeoutMs, setDraftTimeoutMs] = useState("");

  const [runStepVisual, setRunStepVisual] = useState<Map<number, RunStepVisual>>(new Map());
  const [runStepFailureDetail, setRunStepFailureDetail] = useState<Map<number, string>>(new Map());
  const runRevealTimeoutsRef = useRef<number[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const canMutate = canMutateNoCode(getUserRole());

  const loadScript = useCallback(async () => {
    if (!token || !scriptId) return;
    const res = await axios.get<ScriptDetail>(`${apiBase}/scripts/${scriptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setScript(res.data);
    setSteps(res.data.steps ?? []);
    setDirty(false);
    setEditingIndex(null);
    const pid = res.data.projectId;
    if (pid) {
      const dsRes = await axios.get<DataSet[]>(`${apiBase}/datasets?projectId=${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatasets(dsRes.data);
    } else {
      setDatasets([]);
    }
  }, [apiBase, scriptId, token]);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadScript();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải được chi tiết kịch bản");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadScript]);

  useEffect(() => {
    return () => {
      runRevealTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
      runRevealTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    runRevealTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    runRevealTimeoutsRef.current = [];
    queueMicrotask(() => {
      setRunStepVisual(new Map());
      setRunStepFailureDetail(new Map());
    });
  }, [dirty]);

  function resetDraft() {
    setEditingIndex(null);
    setDraftKeyword("navigate");
    setDraftUrl("");
    setDraftSelector("");
    setDraftExpected("");
    setDraftValue("");
    setDraftDataKey("");
    setDraftTimeoutMs("");
  }

  function draftTimeoutMsParsed(): number | undefined {
    const t = draftTimeoutMs.trim();
    if (!t) return undefined;
    const n = Number(t);
    if (!Number.isFinite(n) || Math.floor(n) !== n) return undefined;
    if (n < MIN_STEP_TIMEOUT_MS || n > MAX_STEP_TIMEOUT_MS) return undefined;
    return n;
  }

  function timeoutMsFromStep(step: Step): string {
    if (!step.parameters || typeof step.parameters !== "object") return "";
    const raw = (step.parameters as Record<string, unknown>).timeoutMs;
    if (typeof raw === "number" && Number.isFinite(raw) && Math.floor(raw) === raw) {
      return String(raw);
    }
    if (typeof raw === "string" && /^\d+$/.test(raw.trim())) return raw.trim();
    return "";
  }

  function mergeStepTimeout(parameters: Record<string, unknown>): Record<string, unknown> {
    const ms = draftTimeoutMsParsed();
    const out = { ...parameters };
    if (ms === undefined) {
      delete out.timeoutMs;
      return out;
    }
    out.timeoutMs = ms;
    return out;
  }

  function startEditStep(idx: number) {
    const st = steps[idx];
    if (!st || !KEYWORD_CARDS.some((c) => c.id === st.keyword)) return;
    setDraftKeyword(st.keyword as StepKeyword);
    setDraftUrl(getParam(st, "url"));
    setDraftSelector(getParam(st, "selector"));
    setDraftExpected(getParam(st, "expected"));
    setDraftValue(getParam(st, "value"));
    setDraftDataKey(getParam(st, "dataKey"));
    setDraftTimeoutMs(timeoutMsFromStep(st));
    setEditingIndex(idx);
    setError(null);
    setMsg(null);
  }

  function commitDraftStep() {
    setError(null);
    setMsg(null);

    const kw = draftKeyword;
    const toMs = draftTimeoutMs.trim();
    if (toMs && draftTimeoutMsParsed() === undefined) {
      return setError(
        `Thời gian chờ (ms): nhập số nguyên ${MIN_STEP_TIMEOUT_MS}–${MAX_STEP_TIMEOUT_MS}, hoặc để trống để dùng mặc định (~30 giây).`,
      );
    }

    let parameters: Record<string, unknown>;

    if (kw === "navigate") {
      if (!draftUrl.trim()) return setError("Nhập địa chỉ trang (URL) cần mở.");
      parameters = { url: draftUrl.trim() };
    } else if (kw === "click") {
      if (!draftSelector.trim()) return setError("Nhập selector của nút hoặc vùng cần bấm.");
      parameters = { selector: draftSelector.trim() };
    } else if (kw === "fill") {
      if (!draftSelector.trim()) return setError("Nhập selector của ô cần điền.");
      if (!draftValue.trim() && !draftDataKey.trim()) {
        return setError("Điền giá trị cố định (Value) hoặc tên cột trong bộ dữ liệu (Data key).");
      }
      parameters = {
        selector: draftSelector.trim(),
        value: draftValue.trim() || undefined,
        dataKey: draftDataKey.trim() || undefined,
      };
    } else {
      if (!draftSelector.trim()) return setError("Nhập selector của vùng cần kiểm tra.");
      if (!draftExpected.trim() && !draftDataKey.trim()) {
        return setError("Nhập chữ mong đợi (Expected) hoặc data key từ bộ dữ liệu.");
      }
      parameters = {
        selector: draftSelector.trim(),
        expected: draftExpected.trim() || undefined,
        dataKey: draftDataKey.trim() || undefined,
      };
    }

    parameters = mergeStepTimeout(parameters);

    if (editingIndex !== null) {
      setSteps((prev) => {
        const cur = prev[editingIndex];
        if (!cur) return prev;
        const updated: Step = {
          ...cur,
          order: editingIndex,
          keyword: kw,
          parameters,
        };
        return prev.map((s, i) => (i === editingIndex ? updated : s));
      });
    } else {
      setSteps((prev) =>
        [...prev, { order: prev.length, keyword: kw, targetId: null, parameters }].map((s, i) => ({
          ...s,
          order: i,
        })),
      );
    }
    setDirty(true);
    resetDraft();
  }

  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, order) => ({ ...s, order })));
    setDirty(true);
    setEditingIndex((cur) => {
      if (cur === null) return null;
      if (cur === idx) return null;
      if (cur > idx) return cur - 1;
      return cur;
    });
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= steps.length) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((s, order) => ({ ...s, order }));
    });
    setDirty(true);
    setEditingIndex((cur) => {
      if (cur === null) return null;
      if (cur === idx) return j;
      if (cur === j) return idx;
      return cur;
    });
  }

  function getParam(step: Step, key: string): string {
    if (!step.parameters || typeof step.parameters !== "object") return "";
    const p = step.parameters as Record<string, unknown>;
    const v = p[key];
    return typeof v === "string" ? v : "";
  }

  function appendTimeoutSummary(lines: string[], st: Step) {
    const s = timeoutMsFromStep(st);
    if (s) lines.push(`Thời gian chờ: ${s} ms`);
  }

  function stepSummaryLines(st: Step): string[] {
    if (st.keyword === "navigate") {
      const lines = [`URL: ${getParam(st, "url") || "—"}`];
      appendTimeoutSummary(lines, st);
      return lines;
    }
    if (st.keyword === "click") {
      const lines = [`Selector: ${getParam(st, "selector") || "—"}`];
      appendTimeoutSummary(lines, st);
      return lines;
    }
    if (st.keyword === "fill") {
      const lines = [`Selector: ${getParam(st, "selector") || "—"}`];
      const v = getParam(st, "value");
      const dk = getParam(st, "dataKey");
      if (v) lines.push(`Giá trị: ${v}`);
      if (dk) lines.push(`Lấy từ dataset (key): ${dk}`);
      appendTimeoutSummary(lines, st);
      return lines;
    }
    if (st.keyword === "assertText") {
      const lines = [`Selector: ${getParam(st, "selector") || "—"}`];
      const ex = getParam(st, "expected");
      const dk = getParam(st, "dataKey");
      if (ex) lines.push(`Mong đợi chứa: ${ex}`);
      if (dk) lines.push(`So khớp từ dataset (key): ${dk}`);
      appendTimeoutSummary(lines, st);
      return lines;
    }
    const lines = [String(st.keyword)];
    appendTimeoutSummary(lines, st);
    return lines;
  }

  async function saveSteps() {
    if (!script || !token) return;
    setError(null);
    setMsg(null);
    try {
      await axios.put(
        `${apiBase}/scripts/${script.id}/steps`,
        { steps: steps.map((s, idx) => ({ ...s, order: idx })) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMsg("Đã lưu toàn bộ bước lên máy chủ.");
      await loadScript();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; details?: { errors?: string[] } } } };
      const data = e?.response?.data;
      const lines = Array.isArray(data?.details?.errors) ? data.details.errors : [];
      const joined = lines.length ? `\n${lines.join("\n")}` : "";
      setError((data?.error ?? "Không lưu được") + joined);
    }
  }

  async function runScript() {
    if (!script || !token) return;
    if (dirty) {
      setError(`Bạn đang có thay đổi chưa lưu. Hãy bấm "Lưu các bước" trước khi chạy.`);
      return;
    }
    runRevealTimeoutsRef.current.forEach((t) => window.clearTimeout(t));
    runRevealTimeoutsRef.current = [];

    const pendingMap = new Map<number, RunStepVisual>();
    for (const s of steps) pendingMap.set(s.order, "pending");
    setRunStepVisual(pendingMap);
    setRunStepFailureDetail(new Map());

    setRunning(true);
    setError(null);
    setMsg(null);
    const STAGGER_MS = 120;
    try {
      const body: { scriptId: string; dataSetId?: string } = { scriptId: script.id };
      if (runDatasetId) body.dataSetId = runDatasetId;
      const res = await axios.post<TestRunResponseDto>(`${apiBase}/runs`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = res.data?.results ?? [];
      const agg = aggregateStepResults(raw);
      setRunStepFailureDetail(failureDetailByStepOrder(raw));
      const ordered = [...steps].sort((a, b) => a.order - b.order);

      if (ordered.length === 0) {
        setRunStepVisual(new Map());
        setRunStepFailureDetail(new Map());
      } else {
        ordered.forEach((_, idx) => {
          const tid = window.setTimeout(() => {
            setRunStepVisual(() => {
              const next = new Map<number, RunStepVisual>();
              for (let i = 0; i <= idx; i++) {
                const o = ordered[i].order;
                next.set(o, agg.get(o) ?? "none");
              }
              for (let j = idx + 1; j < ordered.length; j++) {
                next.set(ordered[j].order, "pending");
              }
              return next;
            });
          }, idx * STAGGER_MS);
          runRevealTimeoutsRef.current.push(tid);
        });
      }

      setMsg(`Đã chạy xong. Trạng thái: ${res.data?.status ?? "ok"}. Xem chi tiết trong Báo cáo.`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Chạy kịch bản thất bại");
      setRunStepVisual(new Map());
      setRunStepFailureDetail(new Map());
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950/80 pb-16">
      <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/scripts"
              className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              ← Danh sách
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-white truncate">
                {loading ? "Đang tải…" : script?.name ?? "Kịch bản"}
              </h1>
              {script && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Project <span className="font-mono text-slate-400">{script.projectId}</span>
                </p>
              )}
            </div>
          </div>
          {script && (
            <Link
              href="/reports"
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline shrink-0"
            >
              Mở báo cáo runs →
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        {loading && <p className="text-sm text-slate-400">Đang tải kịch bản…</p>}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            <FiAlertCircle className="shrink-0 mt-0.5 text-red-400" aria-hidden />
            <span>{error}</span>
          </div>
        )}
        {msg && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            <FiCheckCircle className="shrink-0 mt-0.5 text-emerald-400" aria-hidden />
            <span>{msg}</span>
          </div>
        )}

        {script && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: mô tả + luồng bước */}
            <div className="lg:col-span-7 space-y-4">
              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg shadow-black/20">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Các bước chạy (theo thứ tự)</h2>
                  </div>
                  {dirty && canMutate && (
                    <span className="shrink-0 text-[11px] font-medium text-amber-400 bg-amber-950/50 border border-amber-900/50 px-2 py-1 rounded-md">
                      Chưa lưu
                    </span>
                  )}
                </div>

                {steps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-4 py-10 text-center">
                    <p className="text-sm text-slate-400">Chưa có bước nào.</p>
                  </div>
                ) : (
                  <ol className="space-y-0">
                    {steps.map((st, idx) => (
                      <li key={`${st.id ?? "new"}-${idx}-${st.keyword}`} className="flex gap-3">
                        <div className="flex flex-col items-center w-8 shrink-0">
                          <StepTimelineBadge
                            status={runStepVisual.get(st.order)}
                            stepNumber={idx + 1}
                            failureDetail={runStepFailureDetail.get(st.order)}
                          />
                          {idx < steps.length - 1 && <div className="w-px flex-1 min-h-[12px] bg-slate-700 my-1" aria-hidden />}
                        </div>
                        <div className="flex-1 min-w-0 pb-4 last:pb-0">
                          <div
                            className={`rounded-xl border bg-slate-950/60 p-4 flex flex-wrap gap-3 justify-between ${
                              editingIndex === idx
                                ? "border-amber-500/70 ring-2 ring-amber-500/25"
                                : "border-slate-800"
                            }`}
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                                  {keywordLabel(st.keyword)}
                                </span>
                                <code className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{st.keyword}</code>
                                {editingIndex === idx && (
                                  <span className="text-[10px] font-medium text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
                                    Đang sửa
                                  </span>
                                )}
                              </div>
                              <ul className="text-xs text-slate-400 space-y-0.5 font-mono leading-relaxed">
                                {stepSummaryLines(st).map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                            </div>
                            {canMutate && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  title="Lên trên"
                                  disabled={idx === 0}
                                  onClick={() => moveStep(idx, -1)}
                                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <FiArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Xuống dưới"
                                  disabled={idx === steps.length - 1}
                                  onClick={() => moveStep(idx, 1)}
                                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <FiArrowDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Sửa bước"
                                  onClick={() => startEditStep(idx)}
                                  className="p-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-emerald-300"
                                >
                                  <FiEdit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Xóa bước"
                                  onClick={() => removeStep(idx)}
                                  className="p-2 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/50"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {canMutate && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={steps.length === 0}
                      onClick={() => void saveSteps()}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                      <FiSave className="w-4 h-4" />
                      Lưu các bước
                    </button>
                  </div>
                )}
              </section>
            </div>

            {/* Cột phải: chạy + thêm bước */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
              <section className="rounded-2xl border border-emerald-900/30 bg-gradient-to-b from-emerald-950/30 to-slate-900/40 p-5 shadow-lg shadow-black/20">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <FiPlay className="text-emerald-400" />
                  Chạy thử
                </h2>
                <p className="text-xs text-slate-500 mt-1 mb-4">Chọn dataset (nếu cần) rồi chạy.</p>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">Bộ dữ liệu (tuỳ chọn)</label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                  value={runDatasetId}
                  onChange={(e) => setRunDatasetId(e.target.value)}
                >
                  <option value="">Không dùng — một lần chạy duy nhất</option>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={running || !canMutate || steps.length === 0 || dirty}
                  onClick={() => void runScript()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-3 text-sm font-bold hover:bg-emerald-500 disabled:opacity-45 disabled:pointer-events-none transition-colors"
                >
                  {running ? (
                    <>Đang chạy…</>
                  ) : (
                    <>
                      <FiPlay className="w-4 h-4" />
                      Chạy kịch bản
                    </>
                  )}
                </button>
                {!canMutate && (
                  <p className="text-xs text-slate-500 mt-3">Tài khoản của bạn chỉ được xem, không chạy được.</p>
                )}
                {canMutate && steps.length === 0 && (
                  <p className="text-xs text-amber-400/90 mt-3">Thêm ít nhất một bước rồi lưu trước khi chạy.</p>
                )}
              </section>

              {canMutate && (
                <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg shadow-black/20">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      {editingIndex !== null ? (
                        <>
                          <FiEdit3 className="text-amber-400 shrink-0" />
                          Sửa bước {editingIndex + 1}
                        </>
                      ) : (
                        <>
                          <FiPlus className="text-emerald-400 shrink-0" />
                          Thêm bước mới
                        </>
                      )}
                    </h2>
                    {editingIndex !== null && (
                      <button
                        type="button"
                        onClick={resetDraft}
                        className="shrink-0 text-xs text-slate-400 hover:text-white underline-offset-2 hover:underline"
                      >
                        Hủy sửa
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    {editingIndex !== null
                      ? `Chỉnh URL, selector hoặc giá trị bên dưới, rồi bấm "Cập nhật bước".`
                      : "Chọn hành động, điền thông tin, rồi bấm thêm vào danh sách."}
                  </p>

                  <p className="text-xs font-medium text-slate-400 mb-2">Loại bước</p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {KEYWORD_CARDS.map(({ id, label, hint, Icon }) => {
                      const active = draftKeyword === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDraftKeyword(id)}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/40"
                              : "border-slate-700 bg-slate-950/50 hover:border-slate-600"
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-2 ${active ? "text-emerald-400" : "text-slate-500"}`} />
                          <div className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}>{label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{hint}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3 rounded-xl bg-slate-950/40 border border-slate-800/80 p-4">
                    {draftKeyword === "navigate" && (
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1.5">Địa chỉ trang (URL)</label>
                        <input
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                          value={draftUrl}
                          onChange={(e) => setDraftUrl(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                          maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    {draftKeyword !== "navigate" && (
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1.5">Selector (CSS hoặc text=…)</label>
                        <input
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                          value={draftSelector}
                          onChange={(e) => setDraftSelector(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                          maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                          placeholder='#email, [data-testid="submit"], text=Đăng nhập'
                        />
                        <p className="text-[11px] text-slate-600 mt-1.5">
                          Dùng DevTools trên trang đích để copy selector ổn định.
                        </p>
                      </div>
                    )}

                    {draftKeyword === "fill" && (
                      <div className="space-y-3 pt-1">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1.5">
                              Giá trị cố định <span className="text-slate-500 font-normal">(tuỳ chọn A)</span>
                            </label>
                            <input
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                              value={draftValue}
                              onChange={(e) => setDraftValue(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                              placeholder="Ví dụ: admin@test.com"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-300 block mb-1.5">
                              Tên cột trong dataset <span className="text-slate-500 font-normal">(tuỳ chọn B)</span>
                            </label>
                            <input
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                              value={draftDataKey}
                              onChange={(e) => setDraftDataKey(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                              maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                              placeholder="Ví dụ: email hoặc password"
                            />
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-700/90 bg-slate-900/90 px-3 py-2.5 text-[11px] text-slate-400 leading-relaxed space-y-2">
                          <p className="font-semibold text-slate-300 text-xs">Chọn một trong hai cách nhập liệu</p>
                          <ul className="list-disc pl-4 space-y-1.5 marker:text-slate-600">
                            <li>
                              <span className="text-slate-200">Chỉ giá trị cố định:</span> mỗi lần chạy đều điền đúng chuỗi đó.
                              Để trống ô tên cột. Ở khung &quot;Chạy thử&quot; có thể để dataset là &quot;Không dùng&quot;.
                            </li>
                            <li>
                              <span className="text-slate-200">Chỉ tên cột:</span> gõ đúng <em>tên khóa</em> trong mỗi dòng
                              của bộ dữ liệu (ví dụ dòng có khóa <code className="text-emerald-400">email</code> thì nhập
                              đúng <code className="text-emerald-400">email</code> vào ô này). Tạo hoặc sửa bộ dữ liệu ở{" "}
                              <Link href="/datasets" className="text-emerald-400 hover:underline">
                                trang Datasets
                              </Link>
                              . Các bước <strong className="text-slate-300">Điền ô</strong> cùng tên cột sẽ lấy giá trị theo
                              từng dòng khi chạy.
                            </li>
                            <li>
                              Khi dùng tên cột: ở khung <span className="text-slate-200">Chạy thử</span> phải chọn đúng{" "}
                              <strong className="text-slate-300">bộ dữ liệu</strong> — hệ thống chạy lặp lại toàn bộ bước cho
                              mỗi dòng trong bộ đó.
                            </li>
                            <li>
                              Nếu nhập cả hai, lúc chạy sẽ <span className="text-slate-200">ưu tiên giá trị cố định</span>.
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {draftKeyword === "assertText" && (
                      <div className="grid sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1.5">Chữ cần thấy trên trang</label>
                          <input
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                            value={draftExpected}
                            onChange={(e) => setDraftExpected(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                            maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                            placeholder="Đoạn text mong đợi"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1.5">Hoặc key trong dataset</label>
                          <input
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                            value={draftDataKey}
                            onChange={(e) => setDraftDataKey(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                            maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                            placeholder="vd: expectedTitle"
                          />
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-800 pt-3 mt-2">
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Thời gian chờ tối đa (milliseconds){" "}
                        <span className="text-slate-500 font-normal">— tuỳ chọn</span>
                      </label>
                      <input
                        type="number"
                        min={MIN_STEP_TIMEOUT_MS}
                        max={MAX_STEP_TIMEOUT_MS}
                        step={1000}
                        inputMode="numeric"
                        className="w-full sm:max-w-[420px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                        value={draftTimeoutMs}
                        onChange={(e) => setDraftTimeoutMs(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="Để trống = ~30s mặc định"
                      />
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Áp dụng cho <span className="text-slate-300">navigate</span>, <span className="text-slate-300">click</span>,{" "}
                        <span className="text-slate-300">fill</span>, <span className="text-slate-300">assertText</span>{" "}
                        (tải trang, chờ phần tử).                         Phạm vi {MIN_STEP_TIMEOUT_MS}–{MAX_STEP_TIMEOUT_MS} ms. Ví dụ trang SPA chậm:{" "}
                        <span className="font-mono text-slate-500">60000</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={commitDraftStep}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                        editingIndex !== null
                          ? "bg-amber-500 text-white hover:bg-amber-400"
                          : "bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                    >
                      {editingIndex !== null ? (
                        <>
                          <FiEdit3 className="w-4 h-4" />
                          Cập nhật bước
                        </>
                      ) : (
                        <>
                          <FiPlus className="w-4 h-4" />
                          Thêm vào luồng
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      {editingIndex !== null ? "Hủy và xoá form" : "Xoá form"}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
