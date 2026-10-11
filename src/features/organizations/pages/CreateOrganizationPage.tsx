import { zodResolver } from "@hookform/resolvers/zod";
import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { isApiError } from "@/shared/api-client/api-error";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { AREAS, findArea, getCurrentPosition } from "@/shared/lib/areas";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { toast } from "@/shared/ui/toaster";
import { useCreateOrganization } from "../api/organizations-api";
import {
  BUSINESS_TYPES,
  organizationFormSchema,
  type OrganizationFormValues,
} from "../schemas/organization-form";

const selectClass =
  "h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-base aria-invalid:border-destructive md:h-10 md:text-sm";

/**
 * Register a business (flow C). It starts as Pending; an admin verifies it
 * before it can publish. The caller becomes its Owner.
 */
export function CreateOrganizationPage() {
  usePageTitle("List your business");
  const navigate = useNavigate();
  const { user, reloadUser } = useAuth();
  const create = useCreateOrganization();
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: { name: "", address: "", area: "", phone: "" },
    mode: "onTouched",
  });

  // One business per account in this version: go to the existing one.
  const existing = user?.memberships[0];
  if (existing) return <Navigate to={`/org/${existing.organizationId}`} replace />;

  async function useMyLocation() {
    setLocationError(null);
    try {
      setPosition(await getCurrentPosition());
      setValue("area", "me", { shouldValidate: true });
    } catch (e) {
      setLocationError((e as Error).message);
    }
  }

  async function onSubmit(values: OrganizationFormValues) {
    const area = findArea(values.area);
    const coords =
      values.area === "me" && position ? position : area ? { lat: area.lat, lng: area.lng } : null;
    if (!coords) return;
    try {
      const org = await create.mutateAsync({
        name: values.name,
        type: values.type,
        address: values.address,
        latitude: coords.lat,
        longitude: coords.lng,
        phone: values.phone || undefined,
      });
      await reloadUser();
      toast.success("Business submitted for verification.");
      navigate(`/org/${org.id}`);
    } catch {
      // shown below
    }
  }

  return (
    <div className="page-container max-w-2xl py-8 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight">List your business</h1>
      <p className="mt-2 text-muted-foreground">
        Tell us about your bakery, cafe, restaurant or shop. An admin checks every business before
        it can publish, usually within a day.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {isApiError(create.error) && (
          <Alert variant="danger" live="assertive" title="Could not submit">
            {create.error.message}
          </Alert>
        )}
        <Field label="Business name" required error={errors.name?.message}>
          <Input autoComplete="organization" {...register("name")} />
        </Field>
        <Field label="Type of business" required error={errors.type?.message}>
          <select className={selectClass} defaultValue="" {...register("type")}>
            <option value="" disabled>
              Choose…
            </option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Address"
          required
          error={errors.address?.message}
          hint="Where customers collect food."
        >
          <Input autoComplete="street-address" {...register("address")} />
        </Field>
        <div className="space-y-2">
          <Field
            label="Area"
            required
            error={errors.area?.message}
            hint="Used for distance in search. There is no map lookup yet."
          >
            <select className={selectClass} {...register("area")}>
              <option value="" disabled>
                Choose…
              </option>
              {position && <option value="me">My current location</option>}
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0"
            onClick={useMyLocation}
          >
            <LocateFixed aria-hidden="true" />
            Use my current location
          </Button>
          {locationError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {locationError}
            </p>
          )}
        </div>
        <Field label="Phone" error={errors.phone?.message} hint="Optional. Only admins see it.">
          <Input type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit for verification"}
        </Button>
      </form>
    </div>
  );
}
