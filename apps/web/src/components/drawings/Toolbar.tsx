import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, MoreHorizontal, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ToolbarProps {
	drawingName: string;
	onDrawingNameChange: (name: string) => void;
	onSave: () => void;
	onSaveAs: () => void;
	onExit: () => void;
	hasChanges?: boolean;
}

export function Toolbar({ drawingName, onDrawingNameChange, onSave, onSaveAs, hasChanges }: ToolbarProps) {
	const navigate = useNavigate();
	const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
	const [localName, setLocalName] = useState(drawingName);

	const handleRename = () => {
		onDrawingNameChange(localName);
		setIsRenameDialogOpen(false);
	};

	return (
		<div className="border-b bg-background">
			<div className="flex h-14 items-center px-4">
				<Button variant="ghost" size="sm" onClick={() => navigate({ to: "/drawings" })}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>

				<div className="flex-1 px-4">
					<h2 className="text-sm font-medium truncate">{drawingName}</h2>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={() => setIsRenameDialogOpen(true)}>
						<MoreHorizontal className="h-4 w-4" />
					</Button>

					<Button variant="outline" size="sm" onClick={onSaveAs}>
						<Download className="mr-2 h-4 w-4" />
						Save As
					</Button>

					<Button variant="default" size="sm" onClick={onSave}>
						<Save className="mr-2 h-4 w-4" />
						Save {hasChanges && "(unsaved)"}
					</Button>
				</div>
			</div>

			<Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<RenameDialogTitle />
						<DialogDescription>
							Enter a new name for your drawing. This name will be displayed in your drawings list.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<label htmlFor="drawing-rename" className="text-sm font-medium">
								Drawing Name
							</label>
							<Input
								id="drawing-rename"
								defaultValue={drawingName}
								onChange={(e) => setLocalName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handleRename();
									}
								}}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleRename}>Rename</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function RenameDialogTitle() {
	return <DialogTitle>Rename Drawing</DialogTitle>;
}
