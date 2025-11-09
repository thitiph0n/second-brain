import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notes")({
	component: NotesPage,
});

function NotesPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Notes</h1>
				<p className="text-muted-foreground mb-8">
					Your personal knowledge management system coming soon...
				</p>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<div className="border rounded-lg p-6 bg-card">
						<h3 className="font-semibold mb-2">📝 Quick Notes</h3>
						<p className="text-sm text-muted-foreground">Capture ideas instantly</p>
					</div>
					<div className="border rounded-lg p-6 bg-card">
						<h3 className="font-semibold mb-2">🔗 Linked Notes</h3>
						<p className="text-sm text-muted-foreground">Connect related thoughts</p>
					</div>
					<div className="border rounded-lg p-6 bg-card">
						<h3 className="font-semibold mb-2">🧠 Smart Search</h3>
						<p className="text-sm text-muted-foreground">Find anything quickly</p>
					</div>
				</div>
			</div>
		</div>
	);
}
