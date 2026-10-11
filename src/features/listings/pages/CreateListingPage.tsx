import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import {
  organizationQuery,
  useCreateListing,
} from "@/features/organizations/api/organizations-api";
import { isApiError } from "@/shared/api-client/api-error";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import type { ListingSummary, Organization } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { ErrorState } from "@/shared/ui/states";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "@/shared/ui/toaster";
import { ListingCard } from "../components/ListingCard";
import {
  defaultListingValues,
  LISTING_CATEGORIES,
  listingFormSchema,
  pickupWindow,
  serverFieldToFormField,
  toListingInput,
  type ListingFormValues,
} from "../schemas/listing-form";

const selectClass =
  "h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-base aria-invalid:border-destructive md:h-10 md:text-sm";

function ListingForm({ org }: { org: Organization }) {
  const navigate = useNavigate();
  const create = useCreateListing(org.id);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: defaultListingValues(org.address),
    mode: "onTouched",
  });
  const values = useWatch({ control });

  async function onSubmit(values: ListingFormValues) {
    try {
      await create.mutateAsync(toListingInput(values, org));
      toast.success("Listing published. It's now visible in search.");
      navigate(`/org/${org.id}`);
    } catch (error) {
      // Server validation errors go back to their fields (design doc 3.3, note 7)
      if (isApiError(error) && error.code === "VALIDATION_ERROR") {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const formField = serverFieldToFormField[field];
          if (formField) setError(formField, { message: messages[0] });
        }
      }
    }
  }

  // Preview with the live form values, using the same card customers see (note 6).
  const pickup = pickupWindow({
    date: values.date ?? "",
    from: values.from ?? "",
    until: values.until ?? "",
  });
  const validWindow = !Number.isNaN(pickup.start.getTime()) && !Number.isNaN(pickup.end.getTime());
  const preview: ListingSummary = {
    id: "preview",
    title: values.title?.trim() || "Your listing title",
    // The select starts empty (""), which is not a category yet
    category: LISTING_CATEGORIES.find((c) => c === values.category) ?? "Other",
    organization: { id: org.id, name: org.name, isVerified: true },
    price: Number.isFinite(values.price) ? values.price! : 0,
    originalPrice: Number.isFinite(values.originalPrice) ? values.originalPrice! : 0,
    quantityTotal: Number.isFinite(values.quantityTotal) ? values.quantityTotal! : 1,
    quantityAvailable: Number.isFinite(values.quantityTotal) ? values.quantityTotal! : 1,
    pickupStart: (validWindow ? pickup.start : new Date()).toISOString(),
    pickupEnd: (validWindow ? pickup.end : new Date()).toISOString(),
    status: "Active",
    distanceKm: null,
  };

  const serverError =
    isApiError(create.error) && create.error.code !== "VALIDATION_ERROR" ? create.error : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {serverError && (
          <Alert variant="danger" live="assertive" title="Could not publish">
            {serverError.message}
          </Alert>
        )}

        <Field label="Title" required error={errors.title?.message}>
          <Input placeholder="e.g. Mixed pastry box" {...register("title")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Category" required error={errors.category?.message}>
            <select className={selectClass} defaultValue="" {...register("category")}>
              <option value="" disabled>
                Choose…
              </option>
              {LISTING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity" required error={errors.quantityTotal?.message}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              {...register("quantityTotal", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Original price ($)" required error={errors.originalPrice?.message}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.5"
              {...register("originalPrice", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Price now ($)"
            required
            error={errors.price?.message}
            hint="0 gives it away free."
          >
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.5"
              {...register("price", { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Field
          label="Description"
          error={errors.description?.message}
          hint="What's inside, portion size, how to store it."
        >
          <Textarea rows={3} {...register("description")} />
        </Field>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Pickup window</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" required error={errors.date?.message}>
              <Input type="date" {...register("date")} />
            </Field>
            <Field label="From" required error={errors.from?.message}>
              <Input type="time" {...register("from")} />
            </Field>
            <Field label="Until" required error={errors.until?.message}>
              <Input type="time" {...register("until")} />
            </Field>
          </div>
          <p className="text-sm text-muted-foreground">
            Times are in your local time. Between 15 minutes and 12 hours.
          </p>
        </fieldset>

        <div className="space-y-2">
          <Field label="Pickup address" required error={errors.address?.message}>
            <Input autoComplete="street-address" {...register("address")} />
          </Field>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0"
            onClick={() => setValue("address", org.address, { shouldValidate: true })}
          >
            Use the business address
          </Button>
        </div>

        <Field
          label="Allergens & notes"
          required
          error={errors.allergenNotes?.message}
          hint="Required for food safety, for example “Contains gluten, milk and eggs”."
        >
          <Input {...register("allergenNotes")} />
        </Field>

        <div className="flex flex-wrap gap-3 border-t pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Publishing…" : "Publish listing"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => navigate(`/org/${org.id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>

      <aside aria-labelledby="preview-heading" className="lg:sticky lg:top-24 lg:self-start">
        <h2 id="preview-heading" className="font-semibold">
          Live preview
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">How customers will see this listing.</p>
        <div inert>
          <ListingCard listing={preview} />
        </div>
      </aside>
    </div>
  );
}

/** Publish a listing in under a minute (wireframe 6). */
export function CreateListingPage() {
  usePageTitle("New listing");
  const { orgId = "" } = useParams();
  const org = useQuery(organizationQuery(orgId));

  return (
    <div className="page-container py-8 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight">New listing</h1>
      <p className="mt-1 text-muted-foreground">
        Everything customers need to decide in a few seconds.
      </p>
      <div className="mt-8">
        {org.isError ? (
          <ErrorState error={org.error} onRetry={() => void org.refetch()} />
        ) : org.isPending ? (
          <div className="h-96 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
        ) : org.data.status !== "Verified" ? (
          <Alert variant="warning" title="Your business is not verified yet">
            You can publish listings once an admin has verified {org.data.name}.
          </Alert>
        ) : (
          <ListingForm org={org.data} />
        )}
      </div>
    </div>
  );
}
