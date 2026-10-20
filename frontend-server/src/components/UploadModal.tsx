import React, { useState, useEffect, useRef } from "react";
import Uppy from "@uppy/core";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { useFiles } from "@/contexts/FileContext";
import { Button } from "@/components/ui/button";

interface UploadModalProps {
	isOpen?: boolean;
	onClose?: () => void;
}

interface UploadItem {
	id: string;
	name: string;
	size: number;
	type: string;
	progress: number;
	status: "pending" | "uploading" | "success" | "error";
	error?: string;
}

export default function UploadModal({ isOpen: propIsOpen, onClose: propOnClose }: UploadModalProps = {}) {
	const { isUploadModalOpen, closeUploadModal } = useFiles();
	const isOpen = propIsOpen !== undefined ? propIsOpen : isUploadModalOpen;
	const onClose = propOnClose || closeUploadModal;

	const { socket, isConnected } = useSocket();
	const [uploads, setUploads] = useState<UploadItem[]>([]);
	const uppyRef = useRef<Uppy | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		const uppy = new Uppy({
			restrictions: {
				maxFileSize: 5 * 1024 * 1024 * 1024,
				maxNumberOfFiles: 10,
			},
			autoProceed: false,
		});

		uppyRef.current = uppy;

		return () => {
			uppy.cancelAll();
			uppyRef.current = null;
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0 || !socket || !isConnected) return;

		const newUploads: UploadItem[] = Array.from(files).map((file) => ({
			id: Math.random().toString(36).substring(2, 9),
			name: file.name,
			size: file.size,
			type: file.type || "application/octet-stream",
			progress: 0,
			status: "pending",
		}));

		setUploads((prev) => [...prev, ...newUploads]);

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const uploadItem = newUploads[i];

			try {
				setUploads((prev) =>
					prev.map((item) => (item.id === uploadItem.id ? { ...item, status: "uploading" } : item))
				);

				const response: any = await new Promise((resolve) => {
					socket.emit(
						"requestingToUpload",
						{
							fileName: file.name,
							mimeType: file.type || "application/octet-stream",
							sizeBytes: file.size,
							parentId: null,
						},
						(res: any) => resolve(res)
					);
				});

				if (!response || !response.success || !response.data) {
					throw new Error(response?.error || "Failed to obtain upload authorization");
				}

				const { uploadId, signedUrl } = response.data;

				await new Promise<void>((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.open("PUT", signedUrl, true);
					xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

					xhr.upload.onprogress = (event) => {
						if (event.lengthComputable) {
							const percent = Math.round((event.loaded / event.total) * 100);
							setUploads((prev) =>
								prev.map((item) => (item.id === uploadItem.id ? { ...item, progress: percent } : item))
							);
						}
					};

					xhr.onload = async () => {
						if (xhr.status >= 200 && xhr.status < 300) {
							socket.emit("uploadSuccess", { uploadId }, (ackRes: any) => {
								if (ackRes && ackRes.success) {
									setUploads((prev) =>
										prev.map((item) =>
											item.id === uploadItem.id ? { ...item, status: "success", progress: 100 } : item
										)
									);
									resolve();
								} else {
									reject(new Error(ackRes?.error || "Failed to acknowledge upload success"));
								}
							});
						} else {
							socket.emit("uploadFailed", { uploadId }, () => {});
							reject(new Error(`S3 Upload failed with status ${xhr.status}`));
						}
					};

					xhr.onerror = () => {
						socket.emit("uploadFailed", { uploadId }, () => {});
						reject(new Error("Network error during file upload"));
					};

					xhr.send(file);
				});
			} catch (error: any) {
				console.error("Upload error:", error);
				setUploads((prev) =>
					prev.map((item) =>
						item.id === uploadItem.id
							? { ...item, status: "error", error: error.message || "Upload failed" }
							: item
					)
				);
			}
		}
	};
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in-0">
			<div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
					<div className="flex items-center gap-2.5">
						<div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
							<Upload className="size-4" />
						</div>
						<h2 className="font-heading font-bold text-slate-900 text-base">Upload Files</h2>
					</div>
					<button
						onClick={onClose}
						className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="p-6 flex-1 overflow-y-auto space-y-4">
					{!isConnected && (
						<div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
							<AlertCircle className="size-4 shrink-0 text-amber-600" />
							<span>Connecting to real-time upload service... Please wait.</span>
						</div>
					)}

					<label
						className={`border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer ${
							!isConnected ? "opacity-50 pointer-events-none" : ""
						}`}
					>
						<div className="size-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
							<Upload className="size-6" />
						</div>
						<p className="font-semibold text-slate-800 text-sm mb-1">Click to browse or drag files here</p>
						<p className="text-xs text-slate-500">Support for documents, images, videos up to 5GB</p>
						<input type="file" multiple onChange={handleFileSelect} className="hidden" />
					</label>

					{uploads.length > 0 && (
						<div className="space-y-2.5 pt-2">
							<h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
								Upload Queue ({uploads.length})
							</h3>
							<div className="space-y-2">
								{uploads.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white shadow-xs"
									>
										<div className="size-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
											<FileText className="size-5" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<p className="text-xs font-semibold text-slate-800 truncate pr-2">
													{item.name}
												</p>
												<span className="text-[11px] text-slate-500 shrink-0">
													{Math.round(item.size / 1024)} KB
												</span>
											</div>
											<div className="flex items-center gap-2">
												<div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
													<div
														className={`h-full transition-all duration-300 ${
															item.status === "success"
																? "bg-emerald-500"
																: item.status === "error"
																? "bg-rose-500"
																: "bg-blue-600"
														}`}
														style={{ width: `${item.progress}%` }}
													/>
												</div>
												<span className="text-[10px] font-medium text-slate-500 w-8 text-right">
													{item.progress}%
												</span>
											</div>
											{item.error && (
												<p className="text-[10px] text-rose-600 mt-1">{item.error}</p>
											)}
										</div>
										<div className="shrink-0 pl-2">
											{item.status === "uploading" && (
												<Loader2 className="size-5 text-blue-600 animate-spin" />
											)}
											{item.status === "success" && (
												<CheckCircle2 className="size-5 text-emerald-500" />
											)}
											{item.status === "error" && (
												<AlertCircle className="size-5 text-rose-500" />
											)}
											{item.status === "pending" && (
												<div className="size-2 rounded-full bg-slate-300" />
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50">
					<Button
						variant="outline"
						onClick={onClose}
						className="rounded-xl px-5 text-slate-700 hover:bg-slate-100 cursor-pointer"
					>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
