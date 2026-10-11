import { LocateFixed, MapPin } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AREAS, DEFAULT_AREA, getCurrentPosition } from "@/shared/lib/areas";
import { Button } from "@/shared/ui/button";

/**
 * The landing page's single primary action: choose where you are and go to
 * the results. Geolocation is optional and falls back to choosing an area.
 */
export function LocationSearch() {
  const navigate = useNavigate();
  const selectId = useId();
  const [area, setArea] = useState(DEFAULT_AREA.id);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(`/browse?area=${area}`);
  }

  async function useMyLocation() {
    setError(null);
    setLocating(true);
    try {
      const { lat, lng } = await getCurrentPosition();
      navigate(`/browse?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Find food near you">
      <label htmlFor={selectId} className="text-sm font-semibold">
        Where are you?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MapPin
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <select
            id={selectId}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-md border border-input bg-background pr-3 pl-9 text-base"
          >
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="lg">
          Find food near me
        </Button>
      </div>
      <Button
        type="button"
        variant="link"
        className="h-auto px-0"
        onClick={useMyLocation}
        disabled={locating}
      >
        <LocateFixed aria-hidden="true" />
        {locating ? "Finding your location…" : "Use my current location"}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
