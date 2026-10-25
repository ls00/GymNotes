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
    <div className="relative flex min-h-screen items-center justify-center bg-[#1C1C1C] px-4 py-12 selection:bg-white selection:text-[#1C1C1C]">
      <div className="relative w-full max-w-sm">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center">
            <Image src="/icon.svg" alt="" width={48} height={48} priority />
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-wide text-white">
            GYMNOTES
          </h1>
          <p className="mt-1 text-xs text-[#CCCCCC]">
            Evolução de cargas, controle de macros e comunidade
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-6 shadow-2xl shadow-black/40">
          {/* Mode Switcher */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] p-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage(null);
              }}
              className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                !isRegister
                  ? "bg-white text-[#1C1C1C] shadow-sm"
                  : "text-[#CCCCCC] hover:text-white"
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
              className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                isRegister
                  ? "bg-white text-[#1C1C1C] shadow-sm"
                  : "text-[#CCCCCC] hover:text-white"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-[#5C5C5C] bg-white/[0.05] p-3 text-xs text-white">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#CCCCCC]">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-white placeholder-[#CCCCCC] outline-none transition focus:border-white focus:ring-1 focus:ring-white/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#CCCCCC]">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="atleta@gymnotes.com"
                className="w-full rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-white placeholder-[#CCCCCC] outline-none transition focus:border-white focus:ring-1 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#CCCCCC]">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-white placeholder-[#CCCCCC] outline-none transition focus:border-white focus:ring-1 focus:ring-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#1C1C1C] shadow-md transition hover:bg-[#CCCCCC] active:scale-[0.98] disabled:opacity-50"
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
        <div className="mt-8 flex items-center justify-center gap-2 text-center text-[11px] text-[#CCCCCC]">
          <Sparkles className="h-3.5 w-3.5 text-[#CCCCCC]" />
          <span>GymNotes PWA • Projetado para uso na academia</span>
        </div>
      </div>
    </div>
  );
}
