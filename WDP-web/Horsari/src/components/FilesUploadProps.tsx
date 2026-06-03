import { FileText, X } from "lucide-react";
import { useRef } from "react";

export interface FileUploadFieldProps {
    label: string;
    hint?: string;
    file: File | null;
    onChange: (f: File | null) => void;
}

export function PdfUploadField({ label, hint, file, onChange }: FileUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">{label}</label>
            <div
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all duration-150"
            >
                <FileText size={15} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 truncate flex-1">
                    {file ? file.name : "Upload PDF file"}
                </span>
                {file && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(null); }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            {hint && <p className="text-[11.5px] text-gray-400">{hint}</p>}
            <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}