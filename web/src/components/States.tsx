"use client";
import { AlertTriangle, Inbox, Loader2, RotateCw } from "lucide-react";

export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-foreground/60">
      <Loader2 className="animate-spin" size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ label = "Belum ada data." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-foreground/50">
      <Inbox size={30} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  message = "Terjadi kesalahan.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertTriangle className="text-red-500" size={30} />
      <p className="max-w-xs text-sm text-foreground/70">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
        >
          <RotateCw size={15} /> Coba lagi
        </button>
      )}
    </div>
  );
}

export function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
      {children}
    </div>
  );
}
