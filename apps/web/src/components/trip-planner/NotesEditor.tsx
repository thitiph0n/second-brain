import { useState, useRef, useEffect } from "react";
import type { NotesEditorProps } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Simple rich text editor component
export function NotesEditor({
	value,
	onChange,
	placeholder = "Add notes...",
	maxLength = 5000,
	readOnly = false,
	className,
}: NotesEditorProps) {
	const [isEditing, setIsEditing] = useState(false);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea
	useEffect(() => {
		if (textAreaRef.current && !readOnly) {
			textAreaRef.current.style.height = "auto";
			textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
		}
	}, [value, readOnly]);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (maxLength) {
			const newValue = e.target.value.slice(0, maxLength);
			onChange(newValue);
		} else {
			onChange(e.target.value);
		}
	};

	const handleFocus = () => {
		if (!readOnly) {
			setIsEditing(true);
		}
	};

	const handleBlur = () => {
		if (!readOnly) {
			setIsEditing(false);
		}
	};

	const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
	const characterCount = value.length;
	const atMaxLength = maxLength && characterCount >= maxLength;

	return (
		<div className={cn("space-y-2", className)}>
			<div className="relative">
				<Textarea
					ref={textAreaRef}
					value={value}
					onChange={handleInputChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onKeyDown={(e) => {
						// Handle Enter for new line instead of submission
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
						}
					}}
					placeholder={placeholder}
					readOnly={readOnly}
					className={cn(
						"resize-none transition-all duration-200",
						isEditing && "ring-2 ring-primary/20",
						readOnly && "cursor-default bg-muted/50"
					)}
					rows={4}
				/>

				{/* Character counter */}
				{maxLength && (
					<div className={cn(
						"absolute bottom-2 right-2 text-xs",
						atMaxLength ? "text-red-500" : "text-muted-foreground"
					)}>
						{characterCount}/{maxLength}
					</div>
				)}
			</div>

			{/* Toolbar and info */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{readOnly ? (
						<Badge variant="outline">Read Only</Badge>
					) : (
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>{wordCount} words</span>
							{maxLength && (
								<>
									<span>•</span>
									<span>{characterCount} characters</span>
								</>
							)}
						</div>
					)}
				</div>

				{atMaxLength && (
					<p className="text-xs text-red-500">
						Maximum character limit reached
					</p>
				)}
			</div>

			/* Formatting suggestions */
			{value && !readOnly && (
				<div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
					<p className="font-medium mb-1">Formatting tips:</p>
					<ul className="space-y-1">
						<li>Use asterisks for *emphasis* or **bold**</li>
						<li>Use backticks for `code` or formulas</li>
						<li>Use dash (-) for bullet points</li>
						<li>Use numbers (1.) for numbered lists</li>
					</ul>
				</div>
			)}
		</div>
	);
}

// Enhanced notes editor with formatting toolbar
interface RichNotesEditorProps extends NotesEditorProps {
	showToolbar?: boolean;
	toolbarPosition?: "top" | "bottom";
}

export function RichNotesEditor({
	value,
	onChange,
	placeholder,
	maxLength,
	readOnly = false,
	showToolbar = true,
	toolbarPosition = "top",
	className,
}: RichNotesEditorProps) {
	const [isEditing, setIsEditing] = useState(false);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const handleFormatText = (format: string) => {
		if (readOnly) return;

		const textarea = textAreaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = value.substring(start, end);

		let replacement = selectedText;

		switch (format) {
			case "bold":
				replacement = `**${selectedText}**`;
				break;
			case "italic":
				replacement = `*${selectedText}*`;
				break;
			case "code":
				replacement = `\`${selectedText}\``;
				break;
			case "bullet":
				replacement = `\n• ${selectedText}`;
				break;
			case "number":
				replacement = `\n1. ${selectedText}`;
				break;
			case "link":
				const url = prompt("Enter URL:");
				if (url) {
					replacement = `[${selectedText || "link"}](${url})`;
				}
				break;
		}

		const newValue = value.substring(0, start) + replacement + value.substring(end);
		onChange(newValue);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (maxLength) {
			const newValue = e.target.value.slice(0, maxLength);
			onChange(newValue);
		} else {
			onChange(e.target.value);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (readOnly) return;

		// Handle Enter for new lines
		if (e.key === "Enter") {
			e.preventDefault();
			const textarea = textAreaRef.current;
			if (!textarea) return;

			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const beforeCursor = value.substring(0, start);
			const afterCursor = value.substring(end);

			// Check if we're in a list
			const lines = beforeCursor.split("\n");
			const currentLine = lines[lines.length - 1].trim();

			if (currentLine.startsWith("• ")) {
				// Stay in bullet point mode
				const newValue = beforeCursor + "\n• " + afterCursor;
				onChange(newValue);
			} else if (/^\d+\.\s/.test(currentLine)) {
				// Stay in numbered list mode
				const nextNumber = parseInt(currentLine.match(/^\d+/)?.[0] || "1") + 1;
				const newValue = beforeCursor + `\n${nextNumber}. ` + afterCursor;
				onChange(newValue);
			} else {
				// Normal line break
				const newValue = beforeCursor + "\n" + afterCursor;
				onChange(newValue);
			}
		}

		// Handle Tab for indentation
		if (e.key === "Tab") {
			e.preventDefault();
			const textarea = textAreaRef.current;
			if (!textarea) return;

			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const newValue = value.substring(0, start) + "  " + value.substring(end);
			onChange(newValue);
		}
	};

	const insertEmoji = (emoji: string) => {
		if (readOnly) return;

		const textarea = textAreaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const newValue = value.substring(0, start) + emoji + value.substring(end);
		onChange(newValue);
	};

	return (
		<div className={cn("space-y-2", className)}>
			{/* Toolbar */}
			{showToolbar && toolbarPosition === "top" && !readOnly && (
				<div className="flex items-center gap-2 p-2 border rounded-t-md bg-muted/50">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleFormatText("bold")}
						className="h-8 p-2"
						title="Bold"
					>
						<strong>B</strong>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleFormatText("italic")}
						className="h-8 p-2"
						title="Italic"
					>
						<em>I</em>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleFormatText("code")}
						className="h-8 p-2"
						title="Code"
					>
						<code>&lt;/&gt;</code>
					</Button>
					<div className="w-px h-6 bg-border mx-2" />
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleFormatText("bullet")}
						className="h-8 p-2"
						title="Bullet List"
					>
						• List
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleFormatText("number")}
						className="h-8 p-2"
						title="Numbered List"
					>
						1. List
					</Button>
					<div className="w-px h-6 bg-border mx-2" />
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleFormatText("link")}
						className="h-8 p-2"
						title="Insert Link"
					>
						Link
					</Button>
					<div className="w-px h-6 bg-border mx-2" />
					<div className="flex gap-1">
						{["😊", "👍", "❤️", "🎉", "📍", "⏰"].map((emoji) => (
							<Button
								key={emoji}
								variant="ghost"
								size="sm"
								onClick={() => insertEmoji(emoji)}
								className="h-8 p-1 text-lg"
								title={emoji}
							>
								{emoji}
							</Button>
						))}
					</div>
				</div>
			)}

			{/* Textarea */}
			<div className="relative">
				<Textarea
					ref={textAreaRef}
					value={value}
					onChange={handleInputChange}
					onFocus={() => setIsEditing(true)}
					onBlur={() => setIsEditing(false)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					readOnly={readOnly}
					className={cn(
						"resize-none min-h-[120px] transition-all duration-200",
						showToolbar && toolbarPosition === "top" && "rounded-t-none",
						isEditing && "ring-2 ring-primary/20",
						readOnly && "cursor-default bg-muted/50"
					)}
					rows={6}
				/>

				{/* Character counter */}
				{maxLength && (
					<div className={cn(
						"absolute bottom-2 right-2 text-xs",
						value.length >= maxLength * 0.9 ? "text-orange-500" : "text-muted-foreground"
					)}>
						{value.length}/{maxLength}
					</div>
				)}
			</div>

			 {/* Toolbar bottom */}
			{showToolbar && toolbarPosition === "bottom" && !readOnly && (
				<div className="flex items-center justify-between p-2 border rounded-b-md bg-muted/50">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>Words: {value.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
						<span>•</span>
						<span>Chars: {value.length}</span>
					</div>
					<div className="flex items-center gap-2">
						{maxLength && value.length >= maxLength * 0.9 && value.length < maxLength && (
							<Badge variant="secondary" className="text-xs">
								Almost at character limit
							</Badge>
						)}
						{maxLength && value.length >= maxLength && (
							<Badge variant="destructive" className="text-xs">
								Character limit reached
							</Badge>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export function NotesEditorSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-24 w-full rounded-md" />
			<div className="flex items-center justify-between">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-4 w-20" />
			</div>
		</div>
	);
}