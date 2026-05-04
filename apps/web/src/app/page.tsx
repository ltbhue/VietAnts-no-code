import Link from "next/link";
import { FiArrowRight, FiLayers } from "react-icons/fi";
import { ui } from "@/lib/ui";

export default function Home() {
  return (
    <main className={ui.authScreen}>
      <div className={`${ui.authCard} max-w-lg`}>
        <div className="mb-2 flex justify-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
            <FiLayers className="h-6 w-6" aria-hidden />
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Vietants No-code Testing</h1>
        <p className="text-sm text-slate-400 text-center leading-relaxed mb-8">
          Thiết kế kịch bản kiểm thử không cần code, chạy tự động trên trình duyệt và xem báo cáo Pass/Fail rõ ràng.
        </p>
        <Link
          href="/login"
          className={`${ui.btnPrimary} w-full py-3 text-base gap-2`}
        >
          Đăng nhập
          <FiArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="mt-6 text-center text-xs text-slate-600">
          Dành cho QA / BA / PM trong nội bộ Vietants.
        </p>
      </div>
    </main>
  );
}
