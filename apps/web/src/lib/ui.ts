/**
 * Chuỗi class dùng chung — giao diện tối, bo góc lớn, nhấn mạnh emerald.
 * Giữ một nơi để các màn hình đồng bộ và dễ chỉnh sửa.
 */
export const ui = {
  content: "min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/95 pb-16",
  narrow: "max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6",
  wide: "max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6",
  wide720: "max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6",

  card: "rounded-2xl border border-slate-800/90 bg-slate-900/45 p-5 shadow-lg shadow-black/20 backdrop-blur-[1px]",
  cardCompact: "rounded-2xl border border-slate-800/90 bg-slate-900/40 p-4 shadow-md shadow-black/10",
  statCard: "rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4",

  sectionTitle: "text-xs font-semibold uppercase tracking-wider text-slate-500",
  label: "text-xs font-medium text-slate-300 block mb-1.5",
  input:
    "w-full rounded-xl border border-slate-700/90 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600/40 transition-shadow",
  select:
    "w-full rounded-xl border border-slate-700/90 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/40",
  textarea:
    "w-full rounded-xl border border-slate-700/90 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/40 resize-y min-h-[88px]",

  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-900/25 hover:bg-emerald-500 disabled:opacity-45 disabled:pointer-events-none transition-colors",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors",
  btnDanger:
    "inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors",
  btnGhost: "rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors",
  btnSm: "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
  btnIndigo:
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors",

  tableWrap: "overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-950/35",
  table: "min-w-full text-sm text-slate-200",
  thead: "bg-slate-900/95 text-left text-xs uppercase tracking-wider text-slate-500",
  th: "px-4 py-3 font-medium whitespace-nowrap",
  tr: "border-t border-slate-800/70 hover:bg-slate-900/35 transition-colors",
  td: "px-4 py-3 align-top",

  alertError:
    "rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-100",
  alertOk: "rounded-xl border border-emerald-900/45 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100",

  modalOverlay: "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm",
  modalBox: "w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 space-y-4",
  modalBoxMd: "w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 space-y-4",

  pre: "rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-300 overflow-auto leading-relaxed",
  link: "text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-2",

  authScreen:
    "flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12",
  authCard:
    "w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/75 p-8 shadow-2xl shadow-black/50 backdrop-blur-sm",
} as const;
