"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Eye, EyeOff, CheckCircle, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const isLoading = form.formState.isSubmitting;
  const passwordValue = form.watch("newPassword");

  const requirements = [
    { label: "Mínimo 8 caracteres", ok: passwordValue.length >= 8 },
    { label: "Uma letra maiúscula", ok: /[A-Z]/.test(passwordValue) },
    { label: "Uma letra minúscula", ok: /[a-z]/.test(passwordValue) },
    { label: "Um número", ok: /\d/.test(passwordValue) },
  ];

  async function onSubmit(data: ResetPasswordFormData) {
    setError(null);
    if (!token) {
      setError("Token inválido ou expirado. Solicite um novo link.");
      return;
    }

    try {
      const res = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // backend espera { token, password }
        body: JSON.stringify({ token, password: data.newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Link inválido ou expirado. Solicite um novo link.");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/sign-in?reset=true"), 2500);
    } catch {
      setError("Erro ao redefinir senha. Tente novamente.");
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h2>
        <p className="text-gray-500 text-sm mb-6">
          Este link de redefinição é inválido ou já foi utilizado.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 bg-[#dbf249] text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-[#c9e038] transition-colors text-sm"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-[#dbf249] flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha redefinida!</h2>
        <p className="text-gray-500 text-sm">Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Nova senha</h2>
        <p className="mt-2 text-gray-500 text-sm">
          Crie uma nova senha segura para sua conta.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-900">
                  Nova senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-900">
                  Confirmar senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {passwordValue.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 mb-2">A senha deve conter:</p>
              {requirements.map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${ok ? "bg-[#dbf249]" : "bg-gray-200"}`}>
                    {ok && <CheckCircle className="w-3 h-3 text-black" />}
                  </div>
                  <span className={`text-xs transition-colors ${ok ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 w-full bg-[#dbf249] text-black hover:bg-[#c9e038] font-semibold h-11"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isLoading ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-gray-500">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 font-semibold text-gray-900 hover:text-gray-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para o login
        </Link>
        <span className="block mx-auto mt-1 h-1 w-8 rounded-full bg-[#dbf249]" />
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <span className="flex items-center gap-2 font-bold text-xl">Finance App</span>
          </div>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>

      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full bg-gradient-to-b from-gray-200 to-gray-100 flex items-center justify-center">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#EADFD8] to-transparent rounded-t-[100px] scale-150 translate-y-20 opacity-60" />
            <div className="relative z-10">
              <div className="w-48 h-48 rounded-full bg-[#dbf249] flex items-center justify-center shadow-2xl">
                <ShieldCheck className="w-20 h-20 text-black/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
