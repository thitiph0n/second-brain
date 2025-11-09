import { ArrowLeft, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DrawingHeaderProps {
	title?: string;
	description?: string;
	saving?: boolean;
	onSave?: () => Promise<void>;
	onCancel?: () => void;
	onDelete?: () => Promise<void>;
	onTitleChange?: (title: string) => void;
	onDescriptionChange?: (description: string) => void;
	deleting?: boolean;
	editable?: boolean;
	className?: string;
}

export function DrawingHeader({
	title = "New Drawing",
	description = "",
	saving = false,
	onSave,
	onCancel,
	onDelete,
	onTitleChange,
	onDescriptionChange,
	deleting = false,
	editable = true,
	className,
}: DrawingHeaderProps) {
	return (
		<div className={`space-y-4 ${className}`}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{onCancel && (
						<Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
							<ArrowLeft className="h-4 w-4" />
						</Button>
					)}
					<div>
						<h1 className="text-lg font-semibold">
							{editable ? (
								<Input
									value={title}
									onChange={(e) => onTitleChange?.(e.target.value)}
									className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
									placeholder="Drawing title..."
								/>
							) : (
								title
							)}
						</h1>
						{description && (
							<p className="text-sm text-muted-foreground">
								{editable ? (
									<Textarea
										value={description}
										onChange={(e) => onDescriptionChange?.(e.target.value)}
										className="text-sm text-muted-foreground bg-transparent border-none p-0 h-auto resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
										placeholder="Description..."
										rows={1}
									/>
								) : (
									description
								)}
							</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{onDelete && (
						<Button
							variant="outline"
							size="sm"
							onClick={onDelete}
							disabled={saving || deleting}
							className="text-destructive hover:text-destructive"
						>
							{deleting ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<X className="h-3 w-3 mr-1" />
							)}
							Delete
						</Button>
					)}
					{onSave && (
						<Button variant="default" size="sm" onClick={onSave} disabled={saving}>
							{saving ? (
								<Loader2 className="h-3 w-3 animate-spin mr-1" />
							) : (
								<Save className="h-3 w-3 mr-1" />
							)}
							Save
						</Button>
					)}
				</div>
			</div>
			{saving && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
					Saving changes...
				</div>
			)}
		</div>
	);
}
