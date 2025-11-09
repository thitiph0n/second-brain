import { createFileRoute, useParams } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/components/AuthGuard";
import { DrawingPage } from "@/components/drawings/DrawingPage";

export const Route = createFileRoute("/drawings/$id")({
	component: DrawingRoute,
});

function DrawingRoute() {
	const { id } = useParams({ from: "/drawings/$id" });

	return (
		<RequireAuth>
			<DrawingPage drawingId={id} />
		</RequireAuth>
	);
}
