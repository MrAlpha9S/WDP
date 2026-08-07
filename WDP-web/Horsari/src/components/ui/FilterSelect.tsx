import { ChevronDown } from "lucide-react";

interface FilterSelectProps {
    options: string[];
    value: string;
    onChange: (v: string) => void;
    className?: string;
    "aria-label"?: string;
}

// Promoted from the inline FilterSelect first written in Jockeys.tsx — every
// other page (Horses.tsx, Financials.tsx, Admin list pages) reimplemented the
// same native-`<select>` + chevron pattern inline instead of importing it.
// Deliberately kept as a native <select> rather than a custom <div> listbox:
// it's free keyboard/screen-reader support, unlike Select.tsx's custom combobox.
export default function FilterSelect({ options, value, onChange, className, ...rest }: FilterSelectProps) {
    return (
        <div className={`relative ${className ?? ""}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-lg pl-4 pr-8 py-2 text-[12.5px] text-text-muted focus:outline-none focus:border-white/25 cursor-pointer transition-colors duration-150"
                {...rest}
            >
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
    );
}
