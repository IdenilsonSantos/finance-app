"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@/hooks/useSignUp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function SignUpForm() {
  const { form, isLoading, onSubmit, pendingVerification } = useSignUp();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (pendingVerification) {
      router.push("/auth/verify-email");
    }
  }, [pendingVerification, router]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Criar nova conta</h2>
        <p className="mt-2 text-gray-500">
          Bem-vindo! Por favor, insira seus dados
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-900">
                  Nome Completo
                </FormLabel>
                <FormControl>
                  <Input placeholder="João Silva" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-900">
                  Email
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@email.com" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-sm font-medium text-gray-900">
                  Senha
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
                      onClick={() => setShowPassword(!showPassword)}
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

          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 w-full bg-[#dbf249] text-black hover:bg-[#c9e038] font-semibold h-11"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isLoading ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-gray-500">
        Já tem uma conta?
        <Link href="/sign-in" className="font-semibold text-gray-900 hover:text-gray-700 ml-1">
          Entrar
        </Link>
        <span className="block mx-auto mt-1 h-1 w-8 rounded-full bg-[#dbf249]" />
      </p>
    </div>
  );
}
