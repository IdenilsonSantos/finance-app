"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token",
  );

  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setStatus("success");
        setTimeout(() => router.push("/sign-in?verified=true"), 2500);
      })
      .catch(() => setStatus("error"));
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificando...</h2>
        <p className="text-gray-500 text-sm">Aguarde enquanto confirmamos seu e-mail.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#dbf249] flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">E-mail verificado!</h2>
        <p className="text-gray-500 text-sm mb-1">Sua conta foi ativada com sucesso.</p>
        <p className="text-gray-400 text-xs">Redirecionando para o login...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h2>
        <p className="text-gray-500 text-sm mb-6">
          Este link de verificação é inválido, já foi utilizado ou expirou.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 bg-[#dbf249] text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-[#c9e038] transition-colors text-sm"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  // no-token — página de espera (usuário acabou de se cadastrar)
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#dbf249] flex items-center justify-center mb-4">
        <Mail className="w-8 h-8 text-black" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu e-mail</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">
        Enviamos um link de confirmação para o seu e-mail. Clique no link para ativar sua conta.
      </p>
      <p className="text-xs text-gray-400 mb-6">Não encontrou? Verifique a pasta de spam.</p>
      <Link
        href="/sign-in"
        className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
      >
        Voltar para o login
      </Link>
      <span className="block mx-auto mt-1 h-1 w-8 rounded-full bg-[#dbf249]" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <Logo variant="full" className="h-8" />
          </div>
          <Suspense fallback={null}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>

      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full bg-gradient-to-b from-gray-200 to-gray-100 flex items-center justify-center">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#EADFD8] to-transparent rounded-t-[100px] scale-150 translate-y-20 opacity-60" />
            <div className="relative z-10">
              <div className="w-48 h-48 rounded-full bg-[#dbf249] flex items-center justify-center shadow-2xl">
                <Mail className="w-20 h-20 text-black/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
