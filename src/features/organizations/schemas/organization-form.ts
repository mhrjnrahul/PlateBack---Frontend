import { z } from "zod";

export const BUSINESS_TYPES = ["Bakery", "Cafe", "Restaurant", "Grocer", "Other"] as const;

export const organizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the business name.")
    .max(80, "Keep the name under 80 characters."),
  type: z.enum(BUSINESS_TYPES, { error: "Choose the type of business." }),
  address: z.string().trim().min(5, "Enter the full address customers will come to."),
  area: z.string().min(1, "Choose the area, or use your current location."),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^[+\d][\d\s-]{6,}$/.test(v),
      "Enter a valid phone number, or leave it empty.",
    ),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
