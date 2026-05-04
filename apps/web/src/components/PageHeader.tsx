import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800/60 pb-6 mb-6 md:flex-row md:items-start md:justify-between md:gap-6">
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-2xl font-bold text-white tracking-tight md:text-[1.65rem]">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </header>
  );
}
