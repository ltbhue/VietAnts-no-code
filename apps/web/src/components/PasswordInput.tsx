"use client";

import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { ui } from "@/lib/ui";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className ?? ui.input} pr-10`}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-200"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
      >
        {visible ? <FiEyeOff className="h-4 w-4" aria-hidden /> : <FiEye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
