import Link from "next/link";
import { UploadCloud } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title = "No data loaded",
  description = "Upload a workforce CSV file to get started.",
  actionLabel = "Upload a file",
  actionHref = "/upload",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
        <UploadCloud className="w-7 h-7 text-indigo-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-5">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
