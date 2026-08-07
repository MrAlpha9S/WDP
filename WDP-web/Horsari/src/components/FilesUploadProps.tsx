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
            <label className="text-[12px] font-medium text-text-muted tracking-wider uppercase">{label}</label>
            <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                className="flex items-center gap-3 border border-dashed border-border rounded-lg px-3 py-2.5 cursor-pointer hover:border-white/25 hover:bg-surface-raised transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
                <FileText size={15} className="text-text-muted shrink-0" />
                <span className="text-sm text-text-muted truncate flex-1">
                    {file ? file.name : "Upload PDF file"}
                </span>
                {file && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(null); }}
                        aria-label="Remove file"
                        className="text-text-muted hover:text-red transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            {hint && <p className="text-[11.5px] text-text-muted/70">{hint}</p>}
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