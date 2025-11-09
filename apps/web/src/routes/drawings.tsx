import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/auth/components/AuthGuard";

export const Route = createFileRoute("/drawings")({
	component: DrawingsRoute,
});

function DrawingsRoute() {
	return (
		<RequireAuth>
			<Outlet />
		</RequireAuth>
	);
}
