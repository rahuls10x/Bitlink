import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
	Share2, 
	Eye, 
	File as FileGeneric
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DriveFile {
	id: string;
	name: string;
	size: string;
	type: "pdf" | "image" | "document" | "video" | "spreadsheet" | "code" | "other";
	updatedAt: string;
}

export default function DashboardPage() {
	const { user } = useAuth();

	const [files] = useState<DriveFile[]>([
		{ id: "1", name: "Q3_Financial_Report.pdf", size: "4.2 MB", type: "pdf", updatedAt: "Oct 15, 2026" },
		{ id: "2", name: "Brand_Guidelines_2026.png", size: "8.5 MB", type: "image", updatedAt: "Oct 12, 2026" },
		{ id: "3", name: "Product_Roadmap_Draft.docx", size: "1.1 MB", type: "document", updatedAt: "Oct 10, 2026" },
		{ id: "4", name: "Marketing_Campaign_Pitch.mp4", size: "124.8 MB", type: "video", updatedAt: "Oct 08, 2026" },
		{ id: "5", name: "User_Analytics_Q3.xlsx", size: "2.7 MB", type: "spreadsheet", updatedAt: "Oct 05, 2026" },
		{ id: "6", name: "Architecture_Diagram.png", size: "3.4 MB", type: "image", updatedAt: "Oct 02, 2026" },
		{ id: "7", name: "api_gateway_config.ts", size: "45 KB", type: "code", updatedAt: "Sep 28, 2026" },
		{ id: "8", name: "Employee_Handbook_2026.pdf", size: "5.6 MB", type: "pdf", updatedAt: "Sep 25, 2026" },
	]);

	const handleFileClick = (file: DriveFile) => {
		console.log("File clicked:", file.name);
	};

	const handleDownload = (file: DriveFile, e: React.MouseEvent) => {
		e.stopPropagation();
		console.log("Download file:", file.name);
	};

	const handleRename = (file: DriveFile, e: React.MouseEvent) => {
		e.stopPropagation();
		console.log("Rename file:", file.name);
	};

	const handleShare = (file: DriveFile, e: React.MouseEvent) => {
		e.stopPropagation();
		console.log("Share file:", file.name);
	};

	const handleDelete = (file: DriveFile, e: React.MouseEvent) => {
		e.stopPropagation();
		console.log("Delete file:", file.name);
	};

	const getFileIcon = (type: DriveFile["type"]) => {
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

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-slate-900">
						My Files
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Manage your cloud documents, images, and media files securely.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{files.map((file) => (
					<div
						key={file.id}
						onClick={() => handleFileClick(file)}
						className="group relative bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between h-44"
					>
						<div className="flex items-start justify-between">
							<div className="size-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
								{getFileIcon(file.type)}
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<button
											onClick={(e) => e.stopPropagation()}
											className="size-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
											aria-label="File actions"
										/>
									}
								>
									<MoreVertical className="size-4" />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48 rounded-lg">
									<DropdownMenuItem onClick={() => handleFileClick(file)} className="cursor-pointer">
										<Eye className="size-4 mr-2 text-slate-500" />
										<span>Preview</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={(e) => handleDownload(file, e)} className="cursor-pointer">
										<Download className="size-4 mr-2 text-slate-500" />
										<span>Download</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={(e) => handleShare(file, e)} className="cursor-pointer">
										<Share2 className="size-4 mr-2 text-slate-500" />
										<span>Share</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={(e) => handleRename(file, e)} className="cursor-pointer">
										<Edit3 className="size-4 mr-2 text-slate-500" />
										<span>Rename</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem 
										onClick={(e) => handleDelete(file, e)} 
										className="cursor-pointer text-destructive focus:text-destructive"
									>
										<Trash2 className="size-4 mr-2" />
										<span>Delete</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						<div className="mt-3">
							<h3 className="font-medium text-slate-800 text-sm truncate group-hover:text-primary transition-colors" title={file.name}>
								{file.name}
							</h3>
							<div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
								<span>{file.size}</span>
								<span>{file.updatedAt}</span>
							</div>
						</div>
					</div>
				))}
			</div>
			{false && user && null}
		</div>
	);
}
