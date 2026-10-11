import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { isApiError } from "@/shared/api-client/api-error";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { registerSchema, safeRedirect, type RegisterValues } from "../schemas/auth-forms";
import { homeFor, useAuth } from "../session/auth-context";

/**
 * Every account starts as a customer. "?next=business" (from "List your
 * surplus") continues to registering a business afterwards (flow C).
 */
export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const forBusiness = searchParams.get("next") === "business";
  usePageTitle(forBusiness ? "Create a business account" : "Create an account");
  const { user, register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const redirect = forBusiness ? "/org/new" : searchParams.get("redirect");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
    mode: "onTouched",
  });

  if (user) return <Navigate to={safeRedirect(redirect, homeFor(user))} replace />;

  async function onSubmit(values: RegisterValues) {
    try {
      const created = await registerAccount(values);
      navigate(safeRedirect(redirect, homeFor(created)), { replace: true });
    } catch (error) {
      if (isApiError(error) && error.code === "VALIDATION_ERROR") {
        for (const field of ["displayName", "email", "password"] as const) {
          const message = error.fieldErrors[field]?.[0];
          if (message) setError(field, { message });
        }
      } else {
        setError("root", {
          message: isApiError(error) ? error.message : "Could not create the account.",
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {forBusiness ? "Create a business account" : "Create an account"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {forBusiness
            ? "First create your account; next you'll add your business details."
            : "Reserve surplus food near you in a few taps."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {errors.root && (
          <Alert variant="danger" live="assertive">
            {errors.root.message}
          </Alert>
        )}
        <Field label="Your name" required error={errors.displayName?.message}>
          <Input autoComplete="name" {...register("displayName")} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field
          label="Password"
          required
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
