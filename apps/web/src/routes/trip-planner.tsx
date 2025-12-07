import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/trip-planner')({
  component: TripPlannerPage,
});

function TripPlannerPage() {
  return (
      <TripPlannerLayout />
  );
}

import { useLoadScript } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

function TripPlannerLayout() {
  const { loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (loadError) {
      console.error("Google Maps load error:", loadError);
  }

  // We don't block render if not loaded; LocationPicker handles gracefully
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Outlet />
    </div>
  );
}