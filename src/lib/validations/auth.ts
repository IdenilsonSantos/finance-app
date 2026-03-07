import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(50, "O nome deve ter menos de 50 caracteres"),
  email: z
    .string()
    .email("Por favor, insira um endereço de email válido")
    .min(1, "O email é obrigatório"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(100, "A senha deve ter menos de 100 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula e um número"
    ),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z
    .string()
    .email("Por favor, insira um endereço de email válido")
    .min(1, "O email é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export type SignInFormData = z.infer<typeof signInSchema>;
