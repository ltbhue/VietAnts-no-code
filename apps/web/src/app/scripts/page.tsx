"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/api";

interface Project {
  id: string;
  name: string;
}

interface Script {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  project?: Project;
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

const DEFAULT_TEXTBOX_MAX_LENGTH = 255;

function ScriptsPageInner() {
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [datasets, setDatasets] = useState<DataSet[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProjectId, setNewProjectId] = useState("");

  const [runDatasetId, setRunDatasetId] = useState<string>("");
  const [running, setRunning] = useState(false);

  // Step builder (avoid editing raw JSON; ensures navigate step has `url`)
  type StepKeyword = "navigate" | "click" | "fill" | "assertText";
  const [draftKeyword, setDraftKeyword] = useState<StepKeyword>("navigate");
  const [draftUrl, setDraftUrl] = useState("");
  const [draftSelector, setDraftSelector] = useState("");
  const [draftExpected, setDraftExpected] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftDataKey, setDraftDataKey] = useState("");

  const apiBase = getApiBase();

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const loadProjects = useCallback(async () => {
    if (!token) return;
    const res = await axios.get<Project[]>(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjects(res.data);
  }, [apiBase, token]);

  useEffect(() => {
    if (projects.length === 0) return;
    setNewProjectId((prev) => {
      if (prev && projects.some((p) => p.id === prev)) return prev;
      if (projectIdFilter && projects.some((p) => p.id === projectIdFilter)) return projectIdFilter;
      return projects[0].id;
    });
  }, [projects, projectIdFilter]);

  const loadScripts = useCallback(async () => {
    if (!token) return;
    const res = await axios.get<Script[]>(`${apiBase}/scripts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = res.data;
    const filtered = projectIdFilter
      ? all.filter((s) => s.projectId === projectIdFilter)
      : all;
    setScripts(filtered);
  }, [apiBase, token, projectIdFilter]);

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
        await loadProjects();
        await loadScripts();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e?.response?.data?.error ?? "Không tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProjects, loadScripts]);

  useEffect(() => {
    if (selectedScript) {
      loadDatasets(selectedScript.projectId);
    } else {
      setDatasets([]);
    }
  }, [selectedScript, loadDatasets]);

  async function loadSteps(script: Script) {
    if (!token) return;
    setError(null);
    try {
      const res = await axios.get<Script & { steps: Step[] }>(`${apiBase}/scripts/${script.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.steps ?? [];
      setSteps(list);
      setSelectedScript(script);
      setRunDatasetId("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tải bước kịch bản");
    }
  }

  async function saveSteps() {
    if (!selectedScript || !token) return;
    setError(null);
    setMsg(null);
    try {
      await axios.put(
        `${apiBase}/scripts/${selectedScript.id}/steps`,
        {
          // Always re-normalize order so backend receives consistent ordering.
          steps: steps.map((s, idx) => ({ ...s, order: idx })),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMsg("Đã lưu các bước.");
      await loadSteps(selectedScript);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không lưu được");
    }
  }

  function resetDraft() {
    setDraftKeyword("navigate");
    setDraftUrl("");
    setDraftSelector("");
    setDraftExpected("");
    setDraftValue("");
    setDraftDataKey("");
  }

  function addDraftStep() {
    if (!selectedScript) return;
    setError(null);
    setMsg(null);

    const kw = draftKeyword;
    let parameters: Record<string, unknown>;

    if (kw === "navigate") {
      if (!draftUrl.trim()) {
        setError("navigate: cần nhập URL (parameters.url).");
        return;
      }
      parameters = { url: draftUrl.trim() };
    } else if (kw === "click") {
      if (!draftSelector.trim()) {
        setError("click: cần nhập selector (parameters.selector).");
        return;
      }
      parameters = { selector: draftSelector.trim() };
    } else if (kw === "fill") {
      if (!draftSelector.trim()) {
        setError("fill: cần nhập selector (parameters.selector).");
        return;
      }
      if (!draftValue.trim() && !draftDataKey.trim()) {
        setError("fill: cần nhập value hoặc dataKey.");
        return;
      }
      parameters = {
        selector: draftSelector.trim(),
        value: draftValue.trim() || undefined,
        dataKey: draftDataKey.trim() || undefined,
      };
    } else {
      // assertText
      if (!draftSelector.trim()) {
        setError("assertText: cần nhập selector (parameters.selector).");
        return;
      }
      if (!draftExpected.trim() && !draftDataKey.trim()) {
        setError("assertText: cần nhập expected hoặc dataKey.");
        return;
      }
      parameters = {
        selector: draftSelector.trim(),
        expected: draftExpected.trim() || undefined,
        dataKey: draftDataKey.trim() || undefined,
      };
    }

    const nextSteps: Step[] = [
      ...steps,
      {
        order: steps.length,
        keyword: kw,
        targetId: null,
        parameters: parameters satisfies Record<string, unknown>,
      },
    ];
    setSteps(nextSteps.map((s, idx) => ({ ...s, order: idx })));
    resetDraft();
  }

  function getParam(step: Step, key: string): string {
    if (!step.parameters || typeof step.parameters !== "object") return "";
    const p = step.parameters as Record<string, unknown>;
    const v = p[key];
    return typeof v === "string" ? v : "";
  }

  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, order) => ({ ...s, order })));
  }

  async function createScript(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newProjectId) return;
    setError(null);
    try {
      await axios.post(
        `${apiBase}/scripts`,
        { name: newName, description: newDesc || undefined, projectId: newProjectId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      await loadScripts();
      setMsg("Đã tạo kịch bản.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không tạo được");
    }
  }

  async function deleteScript(id: string) {
    if (!confirm("Xóa kịch bản này?")) return;
    if (!token) return;
    setError(null);
    try {
      await axios.delete(`${apiBase}/scripts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedScript?.id === id) {
        setSelectedScript(null);
        setSteps([]);
      }
      await loadScripts();
      setMsg("Đã xóa.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Không xóa được");
    }
  }

  async function runScript() {
    if (!selectedScript || !token) return;
    setRunning(true);
    setError(null);
    setMsg(null);
    try {
      const body: { scriptId: string; dataSetId?: string } = { scriptId: selectedScript.id };
      if (runDatasetId) body.dataSetId = runDatasetId;
      const res = await axios.post(`${apiBase}/runs`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg(
        `Chạy xong. Trạng thái run: ${res.data?.status ?? "ok"}. Xem chi tiết tại Báo cáo.`,
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Chạy kịch bản thất bại");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Kịch bản kiểm thử</h1>
          <p className="text-sm text-slate-300 mt-1">
            Keywords: <code className="text-emerald-400">navigate</code>,{" "}
            <code className="text-emerald-400">click</code>, <code className="text-emerald-400">fill</code>,{" "}
            <code className="text-emerald-400">assertText</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-500"
        >
          + Tạo kịch bản
        </button>
      </div>

      {loading && <p className="text-sm text-slate-300">Đang tải...</p>}
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
      {msg && <p className="text-sm text-emerald-400 mb-2">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="text-sm font-medium mb-3">Danh sách</h2>
          <ul className="space-y-2">
            {scripts.map((s) => (
              <li
                key={s.id}
                className={`rounded-lg border px-3 py-2 flex flex-col gap-1 ${
                  selectedScript?.id === s.id ? "border-emerald-600 bg-slate-900" : "border-slate-800"
                }`}
              >
                <button
                  type="button"
                  onClick={() => loadSteps(s)}
                  className="text-left w-full"
                >
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.project?.name ?? s.projectId}</div>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => deleteScript(s.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {scripts.length === 0 && !loading && (
            <p className="text-xs text-slate-400">Chưa có kịch bản. Tạo mới hoặc đổi project.</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
          <h2 className="text-sm font-medium">Chi tiết &amp; bước</h2>
          {!selectedScript && (
            <p className="text-xs text-slate-400">Chọn một kịch bản bên trái.</p>
          )}
          {selectedScript && (
            <>
              <div className="text-sm">
                <strong>{selectedScript.name}</strong>
                <p className="text-xs text-slate-400 mt-1">{selectedScript.description}</p>
              </div>

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

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium mb-2">Thêm bước</h3>
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

                    {draftKeyword === "click" && null}

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

                  <div className="flex gap-2 mt-3 flex-wrap">
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
                    <p className="text-xs text-slate-400">Chưa có bước nào. Hãy thêm từ khối phía trên.</p>
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
                              {st.keyword === "fill" &&
                                `selector=${getParam(st, "selector")}, value=${getParam(st, "value")}`}
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
              </div>
            </>
          )}
        </section>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <form
            onSubmit={createScript}
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full space-y-3"
          >
            <h3 className="font-medium">Tạo kịch bản</h3>
            <div>
              <label className="text-xs text-slate-400">Project</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Tên</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Mô tả</label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value.slice(0, DEFAULT_TEXTBOX_MAX_LENGTH))}
                maxLength={DEFAULT_TEXTBOX_MAX_LENGTH}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800"
              >
                Hủy
              </button>
              <button type="submit" className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-slate-950">
                Tạo
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-slate-400">Đang tải...</main>}>
      <ScriptsPageInner />
    </Suspense>
  );
}
