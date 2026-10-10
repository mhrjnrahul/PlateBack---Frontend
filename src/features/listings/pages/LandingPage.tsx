import { Link } from "react-router";
import { PlaceholderPage } from "@/app/layout/PlaceholderPage";
import { Button } from "@/shared/ui/button";

export function LandingPage() {
  return (
    <PlaceholderPage
      title="Good food shouldn't go to waste"
      description="Reserve end-of-day surplus from bakeries, cafes and restaurants near you. Pay at pickup. Collect in the window."
      step={4}
    >
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/browse">Find food near me</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/register">List your surplus</Link>
        </Button>
      </div>
    </PlaceholderPage>
  );
}
