"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getApiBase } from "@/lib/api";

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

export default function ScriptDetailPage() {
  const params = useParams<{ id: string }>();
  const scriptId = params.id;
  const apiBase = getApiBase();

  const [script, setScript] = useState<ScriptDetail | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [datasets, setDatasets] = useState<DataSet[]>([]);
  const [runDatasetId, setRunDatasetId] = useState("");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [draftKeyword, setDraftKeyword] = useState<StepKeyword>("navigate");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftSelector, setDraftSelector] = useState("");
  const [draftExpected, setDraftExpected] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftDataKey, setDraftDataKey] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const loadScript = useCallback(async () => {
    if (!token || !scriptId) return;
    const res = await axios.get<ScriptDetail>(`${apiBase}/scripts/${scriptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setScript(res.data);
    setSteps(res.data.steps ?? []);
  }, [apiBase, scriptId, token]);

  const loadDatasets = useCallback(
    async (projectId: string) => {
      if (!token || !projectId) {
        setDatasets([]);
        return;
      }
      const res = await axios.get<DataSet[]>(`${apiBase}/datasets?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDatasets(res.data);
    },
    [apiBase, token],
  );

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
    if (!script?.projectId) return;
    void loadDatasets(script.projectId);
  }, [script?.projectId, loadDatasets]);

  function resetDraft() {
    setDraftKeyword("navigate");
    setDraftUrl("");
    setDraftSelector("");
    setDraftExpected("");
    setDraftValue("");
    setDraftDataKey("");
  }

  function addDraftStep() {
    setError(null);
    setMsg(null);

    const kw = draftKeyword;
    let parameters: Record<string, unknown>;

    if (kw === "navigate") {
      if (!draftUrl.trim()) return setError("navigate: cần nhập URL (parameters.url).");
      parameters = { url: draftUrl.trim() };
    } else if (kw === "click") {
      if (!draftSelector.trim()) return setError("click: cần nhập selector (parameters.selector).");
      parameters = { selector: draftSelector.trim() };
    } else if (kw === "fill") {
      if (!draftSelector.trim()) return setError("fill: cần nhập selector (parameters.selector).");
      if (!draftValue.trim() && !draftDataKey.trim()) return setError("fill: cần nhập value hoặc dataKey.");
      parameters = {
        selector: draftSelector.trim(),
        value: draftValue.trim() || undefined,
        dataKey: draftDataKey.trim() || undefined,
      };
    } else {
      if (!draftSelector.trim()) return setError("assertText: cần nhập selector (parameters.selector).");
      if (!draftExpected.trim() && !draftDataKey.trim()) {
        return setError("assertText: cần nhập expected hoặc dataKey.");
      }
      parameters = {
        selector: draftSelector.trim(),
        expected: draftExpected.trim() || undefined,
        dataKey: draftDataKey.trim() || undefined,
      };
    }

    setSteps((prev) =>
      [...prev, { order: prev.length, keyword: kw, targetId: null, parameters }].map((s, idx) => ({ ...s, order: idx })),
    );
    resetDraft();
  }

  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, order) => ({ ...s, order })));
  }

  function getParam(step: Step, key: string): string {
    if (!step.parameters || typeof step.parameters !== "object") return "";
    const p = step.parameters as Record<string, unknown>;
    const v = p[key];
    return typeof v === "string" ? v : "";
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
      setMsg("Đã lưu các bước.");
      await loadScript();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không lưu được");
    }
  }

  async function runScript() {
    if (!script || !token) return;
    setRunning(true);
    setError(null);
    setMsg(null);
    try {
      const body: { scriptId: string; dataSetId?: string } = { scriptId: script.id };
      if (runDatasetId) body.dataSetId = runDatasetId;
      const res = await axios.post(`${apiBase}/runs`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg(`Chạy xong. Trạng thái run: ${res.data?.status ?? "ok"}.`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Chạy kịch bản thất bại");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Chi tiết kịch bản</h1>
          <p className="text-sm text-slate-300 mt-1">Trang này dùng để xem và tạo bước kiểm thử.</p>
        </div>
        <Link href="/scripts" className="rounded-md bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700">
          Quay lại danh sách
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-300">Đang tải...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}

      {script && (
        <>
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-xs text-slate-400">Tên kịch bản</div>
            <div className="text-sm font-semibold mt-1">{script.name}</div>
            <div className="mt-3 text-xs text-slate-400">Project ID</div>
            <div className="text-sm mt-1">{script.projectId}</div>
            <div className="mt-3 text-xs text-slate-400">Mô tả</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{script.description || "—"}</div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Bộ dữ liệu (tuỳ chọn)</label>
                <select
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm min-w-[180px]"
                  value={runDatasetId}
                  onChange={(e) => setRunDatasetId(e.target.value)}
                >
                  <option value="">— Không dùng —</option>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={running}
                onClick={runScript}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
              >
                {running ? "Đang chạy Playwright..." : "Chạy kịch bản"}
              </button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Thêm bước kiểm thử</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Keyword</label>
                  <select
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    value={draftKeyword}
                    onChange={(e) => setDraftKeyword(e.target.value as StepKeyword)}
                  >
                    <option value="navigate">navigate (cần URL)</option>
                    <option value="click">click (cần selector)</option>
                    <option value="fill">fill (selector + value hoặc dataKey)</option>
                    <option value="assertText">assertText (selector + expected hoặc dataKey)</option>
                  </select>
                </div>
                {draftKeyword === "navigate" && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">URL muốn kiểm tra</label>
                    <input
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      value={draftUrl}
                      onChange={(e) => setDraftUrl(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                      maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                      placeholder="https://example.com"
                    />
                  </div>
                )}
                {draftKeyword !== "navigate" && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Selector</label>
                    <input
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      value={draftSelector}
                      onChange={(e) => setDraftSelector(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                      maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                      placeholder="ví dụ: text=Submit hoặc #login-button"
                    />
                  </div>
                )}
                {draftKeyword === "fill" && (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Value (tuỳ chọn)</label>
                      <input
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                        maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                        placeholder="chuỗi cần điền"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">DataKey (tuỳ chọn)</label>
                      <input
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={draftDataKey}
                        onChange={(e) => setDraftDataKey(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                        maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                        placeholder="key trong rows (ví dụ: email)"
                      />
                    </div>
                  </>
                )}
                {draftKeyword === "assertText" && (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Expected (tuỳ chọn)</label>
                      <input
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={draftExpected}
                        onChange={(e) => setDraftExpected(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                        maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                        placeholder="văn bản mong đợi"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">DataKey (tuỳ chọn)</label>
                      <input
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        value={draftDataKey}
                        onChange={(e) => setDraftDataKey(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                        maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                        placeholder="key trong rows (ví dụ: expectedText)"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={addDraftStep}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500"
                >
                  + Thêm bước
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  Làm mới
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h3 className="text-sm font-medium mb-2">Danh sách bước</h3>
              {steps.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có bước nào.</p>
              ) : (
                <div className="space-y-2">
                  {steps.map((st, idx) => (
                    <div
                      key={`${st.id ?? "new"}-${st.order}-${st.keyword}-${idx}`}
                      className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 flex items-start justify-between gap-3"
                    >
                      <div className="text-xs">
                        <div className="font-semibold">
                          #{idx} <span className="text-emerald-400">{st.keyword}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          {st.keyword === "navigate" && `url=${getParam(st, "url")}`}
                          {st.keyword === "click" && `selector=${getParam(st, "selector")}`}
                          {st.keyword === "fill" && `selector=${getParam(st, "selector")}, value=${getParam(st, "value")}`}
                          {st.keyword === "assertText" &&
                            `selector=${getParam(st, "selector")}, expected=${getParam(st, "expected")}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="text-xs text-red-400 hover:underline shrink-0 mt-0.5"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  disabled={steps.length === 0}
                  onClick={saveSteps}
                  className="rounded-md bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600 disabled:opacity-50"
                >
                  Lưu các bước
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
