import { createFileRoute } from "@tanstack/react-router";
import { DrawingsPage } from "@/components/drawings/DrawingsPage";
import { z } from "zod";

const drawingsSearchSchema = z.object({
	folderId: z.string().optional(),
});

export const Route = createFileRoute("/drawings/")({
	component: DrawingsIndexRoute,
	validateSearch: drawingsSearchSchema,
});

function DrawingsIndexRoute() {
	return <DrawingsPage />;
}
