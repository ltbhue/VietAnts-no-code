"use client";

import { useMemo, useState } from "react";
import { FiCheck, FiSearch } from "react-icons/fi";
import { ui } from "@/lib/ui";

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type MultiSelectSearchProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
};

export function MultiSelectSearch({
  options,
  value,
  onChange,
  searchPlaceholder = "Tìm theo tên hoặc email…",
  emptyMessage = "Không có kết quả.",
  id,
}: MultiSelectSearchProps) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  function toggle(optionValue: string) {
    if (selectedSet.has(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  const listboxId = id ? `${id}-listbox` : undefined;

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <p className="text-xs text-slate-500">Đã chọn {value.length} thành viên</p>
      ) : (
        <p className="text-xs text-slate-500">Chưa chọn thành viên — bấm dòng trong danh sách để chọn.</p>
      )}
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          className={`${ui.input} pl-10`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-controls={listboxId}
        />
      </div>
      <div
        id={listboxId}
        role="listbox"
        aria-multiselectable="true"
        className="max-h-52 overflow-y-auto rounded-xl border border-slate-700/90 bg-slate-950 divide-y divide-slate-800/70"
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          filtered.map((option) => {
            const selected = selectedSet.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggle(option.value)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  selected ? "bg-emerald-950/40 text-emerald-100" : "text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    selected ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-600 bg-slate-900"
                  }`}
                  aria-hidden
                >
                  {selected ? <FiCheck className="h-3 w-3" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="block truncate text-xs text-slate-500">{option.description}</span>
                  ) : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
