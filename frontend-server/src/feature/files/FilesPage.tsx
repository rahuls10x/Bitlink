import { useState } from "react";
import { useFiles } from "@/contexts/FileContext";
import type { ServerFile } from "@/types";
import RenameModal from "@/components/RenameModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { 
	FileText, 
	Image as ImageIcon, 
	FileSpreadsheet, 
	Film, 
	FileCode, 
	MoreVertical, 
	Download, 
	Edit3, 
	Trash2, 
	Eye, 
	File as FileGeneric,
	Search, 
	FolderX, 
	Loader2, 
	AlertCircle,
	Upload
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FileType = "pdf" | "image" | "document" | "video" | "spreadsheet" | "code" | "other";

function formatBytes(bytes: number): string {
	if (!bytes || bytes <= 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateInput: string | Date | undefined): string {
	if (!dateInput) return "Recently";
	try {
		const d = new Date(dateInput);
		if (isNaN(d.getTime())) return "Recently";
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return "Recently";
	}
}

function getFileType(fileName: string, mimeType?: string): FileType {
	const ext = fileName.split(".").pop()?.toLowerCase() || "";
	const mime = mimeType?.toLowerCase() || "";

	if (mime.includes("pdf") || ext === "pdf") return "pdf";
	if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp", "gif", "bmp", "ico"].includes(ext)) return "image";
	if (mime.startsWith("video/") || ["mp4", "webm", "mkv", "mov", "avi"].includes(ext)) return "video";
	if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv") || ["xlsx", "xls", "csv"].includes(ext)) return "spreadsheet";
	if (mime.includes("word") || mime.includes("document") || mime.includes("text/plain") || ["docx", "doc", "txt", "rtf", "md"].includes(ext)) return "document";
	if (mime.includes("json") || mime.includes("javascript") || mime.includes("typescript") || ["ts", "tsx", "js", "jsx", "json", "html", "css"].includes(ext)) return "code";

	return "other";
}

export default function FilesPage() {
	const {
		files,
		isLoading,
		error,
		processingFileId,
		downloadFile,
		previewFile,
		renameFile,
		deleteFile,
		openUploadModal,
	} = useFiles();

	const [searchQuery, setSearchQuery] = useState("");
	const [renameModalFile, setRenameModalFile] = useState<ServerFile | null>(null);
	const [deleteModalFile, setDeleteModalFile] = useState<ServerFile | null>(null);

	const getFileIcon = (type: FileType) => {
		switch (type) {
			case "pdf":
				return <FileText className="size-6 text-rose-500" />;
			case "image":
				return <ImageIcon className="size-6 text-blue-500" />;
			case "document":
				return <FileText className="size-6 text-blue-600" />;
			case "spreadsheet":
				return <FileSpreadsheet className="size-6 text-emerald-600" />;
			case "video":
				return <Film className="size-6 text-purple-600" />;
			case "code":
				return <FileCode className="size-6 text-amber-600" />;
			default:
				return <FileGeneric className="size-6 text-slate-500" />;
		}
	};

	const filteredFiles = files.filter((f) =>
		f.fileName.toLowerCase().includes(searchQuery.toLowerCase().trim())
	);

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Header & Search */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2.5">
						<h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-slate-900">
							My Files
						</h1>
						{!isLoading && (
							<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
								{files.length}
							</span>
						)}
					</div>
					<p className="text-sm text-slate-500 mt-1">
						Manage your cloud documents, images, and media files securely.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
						<Input
							type="text"
							placeholder="Search files..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-9 rounded-xl text-xs bg-white border-slate-200"
						/>
					</div>
				</div>
			</div>

			{/* Error State */}
			{error && (
				<div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
					<AlertCircle className="size-5 shrink-0 text-rose-500" />
					<span>{error}</span>
				</div>
			)}

			{/* Loading Skeletons */}
			{isLoading && (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between h-44 animate-pulse"
						>
							<div className="flex items-start justify-between">
								<div className="size-12 rounded-lg bg-slate-100" />
								<div className="size-7 rounded-full bg-slate-100" />
							</div>
							<div className="space-y-2 mt-4">
								<div className="h-4 bg-slate-100 rounded-md w-3/4" />
								<div className="flex justify-between">
									<div className="h-3 bg-slate-100 rounded-md w-1/4" />
									<div className="h-3 bg-slate-100 rounded-md w-1/3" />
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Empty State */}
			{!isLoading && !error && filteredFiles.length === 0 && (
				<div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8">
					<div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
						<FolderX className="size-7" />
					</div>
					<h3 className="font-semibold text-slate-800 text-base mb-1">
						{searchQuery ? "No matching files found" : "No files uploaded yet"}
					</h3>
					<p className="text-xs text-slate-500 max-w-xs mb-4">
						{searchQuery
							? `No files match your query "${searchQuery}". Try searching with a different term.`
							: "Upload your first document, image, or media file to get started."}
					</p>
					{searchQuery ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSearchQuery("")}
							className="rounded-xl text-xs"
						>
							Clear Search
						</Button>
					) : (
						<Button
							size="sm"
							onClick={openUploadModal}
							className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
						>
							<Upload className="size-3.5 mr-1.5" />
							Upload File
						</Button>
					)}
				</div>
			)}

			{/* File Grid */}
			{!isLoading && filteredFiles.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredFiles.map((file) => {
						const fileType = getFileType(file.fileName, file.mimeType);
						const isProcessing = processingFileId === file.fileId;

						return (
							<div
								key={file.fileId}
								onClick={() => previewFile(file)}
								className="group relative bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between h-44"
							>
								<div className="flex items-start justify-between">
									<div className="size-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
										{isProcessing ? (
											<Loader2 className="size-5 text-blue-600 animate-spin" />
										) : (
											getFileIcon(fileType)
										)}
									</div>

									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<button
													onClick={(e) => e.stopPropagation()}
													disabled={isProcessing}
													className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 cursor-pointer"
													aria-label="File actions"
												/>
											}
										>
											<MoreVertical className="size-4" />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48 rounded-lg">
											<DropdownMenuItem onClick={(e) => { e.stopPropagation(); previewFile(file); }} className="cursor-pointer">
												<Eye className="size-4 mr-2 text-slate-500" />
												<span>Preview</span>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={(e) => { e.stopPropagation(); downloadFile(file); }} className="cursor-pointer">
												<Download className="size-4 mr-2 text-slate-500" />
												<span>Download</span>
											</DropdownMenuItem>
											<DropdownMenuItem 
												onClick={(e) => {
													e.stopPropagation();
													setRenameModalFile(file);
												}} 
												className="cursor-pointer"
											>
												<Edit3 className="size-4 mr-2 text-slate-500" />
												<span>Rename</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem 
												onClick={(e) => {
													e.stopPropagation();
													setDeleteModalFile(file);
												}} 
												className="cursor-pointer text-destructive focus:text-destructive"
											>
												<Trash2 className="size-4 mr-2" />
												<span>Delete</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div className="mt-3">
									<h3 
										className="font-medium text-slate-800 text-sm truncate group-hover:text-primary transition-colors" 
										title={file.fileName}
									>
										{file.fileName}
									</h3>
									<div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
										<span>{formatBytes(file.sizeBytes)}</span>
										<span>{formatDate(file.modifiedAt || file.createdAt)}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Rename Modal */}
			<RenameModal
				isOpen={!!renameModalFile}
				file={renameModalFile}
				onClose={() => setRenameModalFile(null)}
				onRename={renameFile}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmModal
				isOpen={!!deleteModalFile}
				file={deleteModalFile}
				onClose={() => setDeleteModalFile(null)}
				onDelete={deleteFile}
			/>
		</div>
	);
}
