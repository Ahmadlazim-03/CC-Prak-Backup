"use client";
import { useAuth } from "@/components/AuthProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { X, LogIn } from "lucide-react";

/** Modal login/registrasi yang muncul ON-DEMAND (saat aksi butuh akun). */
export function AuthModal() {
  const { promptOpen, promptReason, cancelPrompt, user } = useAuth();
  if (!promptOpen || user) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={cancelPrompt}
    >
      <div
        className="w-full max-w-md animate-[slideUp_.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-t-3xl bg-background p-4 shadow-2xl sm:rounded-3xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <LogIn size={20} />
              </div>
              <div>
                <h2 className="font-bold leading-tight">Masuk dulu, yuk</h2>
                <p className="text-xs text-foreground/55">
                  {promptReason ?? "Fitur ini memerlukan akun."}
                </p>
              </div>
            </div>
            <button
              onClick={cancelPrompt}
              aria-label="Tutup"
              className="rounded-lg p-1 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
          <AuthPanel />
        </div>
      </div>
    </div>
  );
}
