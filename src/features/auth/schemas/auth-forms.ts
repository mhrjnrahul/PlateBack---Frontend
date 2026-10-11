import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter your name (2-60 characters).")
    .max(60, "Enter your name (2-60 characters)."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
export type RegisterValues = z.infer<typeof registerSchema>;

/**
 * Where to go after signing in. Only same-site paths are allowed, so a
 * crafted ?redirect=https://evil.example link cannot send users elsewhere.
 */
export function safeRedirect(target: string | null, fallback: string) {
  return target && target.startsWith("/") && !target.startsWith("//") ? target : fallback;
}
