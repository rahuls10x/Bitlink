import { useState } from "react";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import type { ServerFile } from "@/types";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
	isOpen: boolean;
	file: ServerFile | null;
	onClose: () => void;
	onDelete: (fileId: string) => Promise<boolean>;
}

export default function DeleteConfirmModal({ isOpen, file, onClose, onDelete }: DeleteConfirmModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isOpen || !file) return null;

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			setError(null);
			const success = await onDelete(file.fileId);
			if (success) {
				onClose();
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "Failed to delete file";
			setError(errorMessage);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
			<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
				{/* Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
					<div className="flex items-center gap-2.5">
						<div className="size-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
							<Trash2 className="size-4" />
						</div>
						<div>
							<h2 className="text-base font-semibold text-slate-800">Delete File</h2>
							<p className="text-xs text-slate-500">Confirm permanent file deletion</p>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={isDeleting}
						className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Modal Body */}
				<div className="p-6 space-y-4">
					<div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50/60 border border-rose-100">
						<AlertTriangle className="size-5 shrink-0 text-rose-600 mt-0.5" />
						<div className="text-xs text-rose-900 leading-relaxed">
							<p className="font-semibold text-rose-950 mb-1">Are you sure you want to delete this file?</p>
							<p className="break-all font-mono text-[11px] bg-rose-100/70 text-rose-900 px-1.5 py-0.5 rounded-md inline-block my-1">
								{file.fileName}
							</p>
							<p className="text-rose-700 mt-1">This action cannot be undone. The file will be permanently removed from your storage.</p>
						</div>
					</div>

					{error && (
						<div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
							{error}
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isDeleting}
						className="rounded-xl px-4 text-slate-700 hover:bg-slate-100 cursor-pointer"
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
						className="rounded-xl px-5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
					>
						{isDeleting ? (
							<>
								<Loader2 className="size-4 mr-2 animate-spin" />
								Deleting...
							</>
						) : (
							"Delete"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
