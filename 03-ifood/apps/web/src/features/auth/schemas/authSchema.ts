import * as z from 'zod';

export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['customer', 'admin']),
});

export const signupSchema = userSchema.omit({ user_id: true }).extend({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = signupSchema.omit({ role: true });

export type LoginFormType = z.infer<typeof loginSchema>;
export type SignupFormType = z.infer<typeof signupSchema>;
export type UserType = z.infer<typeof userSchema>;

