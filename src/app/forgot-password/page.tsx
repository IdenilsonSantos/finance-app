"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validations/auth";
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
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email.toLowerCase() }),
      });
      // Sempre mostra sucesso para não revelar se o email existe
      setSentEmail(data.email.toLowerCase());
      setSent(true);
    } catch {
      setSentEmail(data.email.toLowerCase());
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Painel esquerdo */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <Logo variant="full" className="h-8" />
          </div>

          {sent ? (
            <div className="w-full max-w-md mx-auto">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#dbf249] flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Verifique seu e-mail</h2>
                <p className="mt-2 text-gray-500 text-sm">
                  Enviamos um link de redefinição de senha para
                </p>
                <p className="font-semibold text-gray-900 text-sm mt-0.5">{sentEmail}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-6">
                {[
                  "Abra o e-mail que enviamos",
                  "Clique no link de redefinição",
                  "Crie uma nova senha segura",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#dbf249] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-black">{i + 1}</span>
                    </div>
                    <span className="text-sm text-gray-600">{step}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center mb-6">
                O link expira em 1 hora. Caso não encontre o e-mail, verifique a pasta de spam.
              </p>

              <button
                onClick={() => { setSent(false); form.reset(); }}
                className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors text-center"
              >
                Tentar com outro e-mail
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Esqueceu a senha?</h2>
                <p className="mt-2 text-gray-500 text-sm">
                  Sem problema. Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="block text-sm font-medium text-gray-900">
                          E-mail
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seumail@email.com"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 w-full bg-[#dbf249] text-black hover:bg-[#c9e038] font-semibold h-11"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {isLoading ? "Enviando..." : "Enviar link de redefinição"}
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
          )}
        </div>
      </div>

      {/* Painel direito decorativo */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full bg-gradient-to-b from-gray-200 to-gray-100 flex items-center justify-center">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#EADFD8] to-transparent rounded-t-[100px] scale-150 translate-y-20 opacity-60" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-6">
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
