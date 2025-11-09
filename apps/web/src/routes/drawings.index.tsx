import { createFileRoute } from "@tanstack/react-router";
import { DrawingsPage } from "@/components/drawings/DrawingsPage";

export const Route = createFileRoute("/drawings/")({
	component: DrawingsIndexRoute,
});

function DrawingsIndexRoute() {
	return <DrawingsPage />;
}
