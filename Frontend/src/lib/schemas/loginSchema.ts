import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(4, 'Senha deve ter no mínimo 4 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
