"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, isLoggingIn, register, isRegistering } = useAuth();
  const isLoading = isLoggingIn || isRegistering;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setErrorMessage("Por favor, preencha seu nome.");
          return;
        }
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axiosErr.response?.data?.message || "Falha na autenticação. Verifique os dados.");
      } else {
        setErrorMessage("Erro ao conectar ao servidor.");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 selection:bg-brand selection:text-rich">
      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center">
            <Image src="/icon.svg" alt="" width={48} height={48} priority />
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-wide text-white">
            GYMNOTES
          </h1>
          <p className="mt-1 text-xs text-muted">
            Evolução de cargas, controle de macros e comunidade
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40">
          {/* Mode Switcher */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage(null);
              }}
              className={`min-h-10 rounded-lg py-1.5 text-sm font-medium transition-all ${
                !isRegister
                  ? "bg-brand text-rich shadow-sm"
                  : "text-muted hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMessage(null);
              }}
              className={`min-h-10 rounded-lg py-1.5 text-sm font-medium transition-all ${
                isRegister
                  ? "bg-brand text-rich shadow-sm"
                  : "text-muted hover:text-white"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-border bg-white/[0.05] p-3 text-xs text-white">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="register-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="register-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="min-h-12 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-white placeholder-muted outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/20"
                />
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                E-mail
              </label>
              <input
                type="email"
                id="login-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="atleta@gymnotes.com"
                className="min-h-12 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-white placeholder-muted outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/20"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
                Senha
              </label>
              <input
                type="password"
                id="login-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-12 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-white placeholder-muted outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-rich shadow-md shadow-brand/10 transition hover:bg-brand-muted active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? "Criar Conta de Atleta" : "Acessar Plataforma"}</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-center text-[11px] text-muted">
          <Sparkles className="h-3.5 w-3.5 text-muted" />
          <span>GymNotes PWA • Projetado para uso na academia</span>
        </div>
      </div>
    </div>
  );
}
