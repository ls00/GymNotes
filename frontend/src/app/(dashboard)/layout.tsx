"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const ensureSession = () => {
      if (localStorage.getItem("gymnotes_token")) {
        setHasSession(true);
      } else {
        setHasSession(false);
        router.replace("/login");
      }
    };

    ensureSession();
    window.addEventListener("storage", ensureSession);
    return () => window.removeEventListener("storage", ensureSession);
  }, [router]);

  if (!hasSession) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center text-sm text-muted">
        Verificando sua sessão…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      <BottomNav />
      <div className="dashboard-content mx-auto w-full max-w-7xl md:px-8 md:pt-8">
        {children}
      </div>
    </div>
  );
}
