import type { z } from 'zod';
import type { signInSchema, signUpSchema } from './inputs';

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
