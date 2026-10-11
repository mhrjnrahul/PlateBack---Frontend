import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { isApiError } from "@/shared/api-client/api-error";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { DEMO_PASSWORD, DemoAccounts } from "../components/DemoAccounts";
import { loginSchema, safeRedirect, type LoginValues } from "../schemas/auth-forms";
import { homeFor, useAuth } from "../session/auth-context";

const mocksOn = import.meta.env.VITE_USE_MOCKS !== "false";

export function LoginPage() {
  usePageTitle("Log in");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (user) return <Navigate to={safeRedirect(redirect, homeFor(user))} replace />;

  async function onSubmit(values: LoginValues) {
    try {
      const signedIn = await login(values);
      navigate(safeRedirect(redirect, homeFor(signedIn)), { replace: true });
    } catch (error) {
      setError("root", {
        message: isApiError(error) ? error.message : "Could not log in. Please try again.",
      });
    }
  }

  function pickDemo(email: string) {
    setValue("email", email, { shouldValidate: true });
    setValue("password", DEMO_PASSWORD, { shouldValidate: true });
    setFocus("password");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
        <p className="mt-1 text-muted-foreground">
          {redirect
            ? "Log in to continue."
            : "Welcome back. Log in to reserve food and see your pickup codes."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {errors.root && (
          <Alert variant="danger" live="assertive">
            {errors.root.message}
          </Alert>
        )}
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" required error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm">
        New to PlateBack?{" "}
        <Link
          to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
          className="font-semibold text-primary underline underline-offset-4 hover:no-underline"
        >
          Create an account
        </Link>
      </p>

      {mocksOn && <DemoAccounts onPick={pickDemo} />}
    </div>
  );
}
