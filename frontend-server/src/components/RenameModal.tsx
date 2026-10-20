import React, { useState, useEffect, useRef } from "react";
import { Edit3, X, Loader2, AlertCircle } from "lucide-react";
import type { ServerFile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameModalProps {
	isOpen: boolean;
	file: ServerFile | null;
	onClose: () => void;
	onRename: (fileId: string, newFileName: string) => Promise<boolean>;
}

function RenameModalDialog({ file, onClose, onRename }: { file: ServerFile; onClose: () => void; onRename: (fileId: string, newFileName: string) => Promise<boolean> }) {
	const [fileName, setFileName] = useState(file.fileName);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Focus and select filename without extension
		const timer = setTimeout(() => {
			if (inputRef.current) {
				inputRef.current.focus();
				const lastDotIndex = file.fileName.lastIndexOf(".");
				if (lastDotIndex > 0) {
					inputRef.current.setSelectionRange(0, lastDotIndex);
				} else {
					inputRef.current.select();
				}
			}
		}, 50);

		return () => clearTimeout(timer);
	}, [file.fileName]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = fileName.trim();

		if (!trimmed) {
			setError("File name is required");
			return;
		}

		if (trimmed.length > 255) {
			setError("File name cannot exceed 255 characters");
			return;
		}

		if (trimmed === "." || trimmed === "..") {
			setError("Invalid file name");
			return;
		}

		if (/[\\/]/.test(trimmed)) {
			setError("File name cannot contain path separators (/ or \\)");
			return;
		}

		if (trimmed === file.fileName) {
			onClose();
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);
			const success = await onRename(file.fileId, trimmed);
			if (success) {
				onClose();
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "Failed to rename file";
			setError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
			<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
					<div className="flex items-center gap-2.5">
						<div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
							<Edit3 className="size-4" />
						</div>
						<div>
							<h2 className="text-base font-semibold text-slate-800">Rename File</h2>
							<p className="text-xs text-slate-500">Enter a new name for your file</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={isSubmitting}
						className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Modal Body */}
				<form onSubmit={handleSubmit}>
					<div className="p-6 space-y-4">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
								File Name
							</label>
							<Input
								ref={inputRef}
								type="text"
								value={fileName}
								onChange={(e) => {
									setFileName(e.target.value);
									if (error) setError(null);
								}}
								disabled={isSubmitting}
								className="h-10 text-sm rounded-xl"
								placeholder="Enter file name"
							/>
						</div>

						{error && (
							<div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
								<AlertCircle className="size-4 shrink-0 text-rose-500" />
								<span>{error}</span>
							</div>
						)}
					</div>

					{/* Modal Footer */}
					<div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
							className="rounded-xl px-4 text-slate-700 hover:bg-slate-100 cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || !fileName.trim()}
							className="rounded-xl px-5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="size-4 mr-2 animate-spin" />
									Renaming...
								</>
							) : (
								"Rename"
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default function RenameModal({ isOpen, file, onClose, onRename }: RenameModalProps) {
	if (!isOpen || !file) return null;

	return <RenameModalDialog key={file.fileId} file={file} onClose={onClose} onRename={onRename} />;
}

