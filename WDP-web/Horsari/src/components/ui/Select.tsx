import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
}

export default function Select({ value, onChange, options, placeholder = "Select...", className = "" }: SelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 bg-bg border border-border rounded p-2.5 text-[13px] text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
            >
                <span className={selected ? "text-white truncate" : "text-gray-500 truncate"}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown size={14} className={`text-gray-500 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-surface border border-border rounded shadow-xl z-50 py-1">
                    {options.map(o => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => { onChange(o.value); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors ${o.value === value ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
                        >
                            {o.label}
                        </button>
                    ))}
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-[12px] text-gray-600">No options</div>
                    )}
                </div>
            )}
        </div>
    );
}
