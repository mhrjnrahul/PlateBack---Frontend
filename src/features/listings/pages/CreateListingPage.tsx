import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import {
  organizationQuery,
  useCreateListing,
} from "@/features/organizations/api/organizations-api";
import { isApiError } from "@/shared/api-client/api-error";
import type { ReactNode } from "react";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { discountPercent } from "@/shared/lib/money";
import type { ListingSummary, Organization } from "@/shared/types/api";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { MoneyInput } from "@/shared/ui/money-input";
import { ErrorState } from "@/shared/ui/states";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "@/shared/ui/toaster";
import { ListingCard } from "../components/ListingCard";
import { Select } from "@/shared/ui/select";
import { PageHeader } from "@/shared/ui/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  defaultListingValues,
  LISTING_CATEGORIES,
  listingFormSchema,
  pickupWindow,
  serverFieldToFormField,
  toListingInput,
  type ListingFormValues,
} from "../schemas/listing-form";

/** A titled group of fields; the legend reads as the group's heading. */
function FormGroup({
  legend,
  description,
  children,
}: {
  legend: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-4 border-t pt-6 first-of-type:border-t-0 first-of-type:pt-0">
      <legend className="text-lg font-semibold">{legend}</legend>
      {description && <p className="-mt-3 text-sm text-muted-foreground">{description}</p>}
      {children}
    </fieldset>
  );
}

function ListingForm({ org }: { org: Organization }) {
  const navigate = useNavigate();
  const desktop = useMediaQuery("(width >= 64rem)");
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

  const percent = discountPercent(preview.originalPrice, preview.price);
  const discountText =
    !Number.isFinite(values.price) || !Number.isFinite(values.originalPrice)
      ? "Enter both prices to see the discount."
      : preview.price === 0
        ? "Customers see it as free."
        : percent > 0
          ? `Customers see ${percent}% off.`
          : "No discount yet: the selling price is the same as the MRP.";

  const previewCard = (
    <div inert>
      <ListingCard listing={preview} />
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {serverError && (
          <Alert variant="danger" live="assertive" title="Could not publish">
            {serverError.message}
          </Alert>
        )}

        <FormGroup legend="Basics">
          <Field label="Title" required error={errors.title?.message}>
            <Input placeholder="e.g. Mixed pastry box" {...register("title")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required error={errors.category?.message}>
              <Select defaultValue="" {...register("category")}>
                <option value="" disabled>
                  Choose…
                </option>
                {LISTING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
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
          </div>
          <Field
            label="Description"
            error={errors.description?.message}
            hint="What's inside, portion size, how to store it."
          >
            <Textarea rows={3} {...register("description")} />
          </Field>
        </FormGroup>

        <FormGroup legend="Pricing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="MRP" required error={errors.originalPrice?.message}>
              <MoneyInput {...register("originalPrice", { valueAsNumber: true })} />
            </Field>
            <Field
              label="Selling price"
              required
              error={errors.price?.message}
              hint="Selling price must be equal to or lower than MRP. Enter 0 to give it away free."
            >
              <MoneyInput {...register("price", { valueAsNumber: true })} />
            </Field>
          </div>
          <p className="text-sm font-semibold text-urgency">{discountText}</p>
        </FormGroup>

        <FormGroup
          legend="Pickup"
          description="In your local time. Between 15 minutes and 12 hours."
        >
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
        </FormGroup>

        <FormGroup legend="Safety">
          <Field
            label="Allergens & notes"
            required
            error={errors.allergenNotes?.message}
            hint="Required for food safety, for example “Contains gluten, milk and eggs”."
          >
            <Input {...register("allergenNotes")} />
          </Field>
        </FormGroup>

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

      {desktop ? (
        <aside aria-labelledby="preview-heading" className="sticky top-24 self-start">
          <h2 id="preview-heading" className="font-semibold">
            Preview
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">How customers will see this listing.</p>
          {previewCard}
        </aside>
      ) : (
        // On small screens the preview would push the form down; keep it one tap away
        <details className="order-first rounded-xl border p-4 open:space-y-3">
          <summary className="cursor-pointer font-semibold">Preview</summary>
          {previewCard}
        </details>
      )}
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
      <PageHeader
        title="New listing"
        description="Everything customers need to decide in a few seconds."
      />
      <div className="mt-8">
        {org.isError ? (
          <ErrorState error={org.error} onRetry={() => void org.refetch()} />
        ) : org.isPending ? (
          <Skeleton className="h-96 rounded-xl" />
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
