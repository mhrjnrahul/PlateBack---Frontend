import { useParams } from "react-router";
import { PlaceholderPage } from "@/app/layout/PlaceholderPage";

export function ListingDetailPage() {
  const { id } = useParams();
  return (
    <PlaceholderPage
      title="Listing detail"
      description={`Details, allergens, live stock and the reserve button for listing ${id}.`}
      step={6}
    />
  );
}
