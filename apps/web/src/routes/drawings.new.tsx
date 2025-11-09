import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/components/AuthGuard";
import { NewDrawingPage } from "@/components/drawings/NewDrawingPage";

export const Route = createFileRoute("/drawings/new")({
	component: NewDrawingRoute,
});

function NewDrawingRoute() {
	return (
		<RequireAuth>
			<NewDrawingPage />
		</RequireAuth>
	);
}
