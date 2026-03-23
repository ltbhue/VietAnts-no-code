import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-slate-900/70 p-8 shadow-xl shadow-slate-900/60 border border-slate-800">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          Vietants No-code Testing
        </h1>
        <p className="text-sm text-slate-300 mb-6 text-center">
          Đăng nhập để quản lý kịch bản kiểm thử no-code, thực thi và xem báo cáo.
        </p>
        <Link
          href="/login"
          className="block w-full text-center rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition"
        >
          Đi tới màn hình đăng nhập
        </Link>
      </div>
    </main>
  );
}
