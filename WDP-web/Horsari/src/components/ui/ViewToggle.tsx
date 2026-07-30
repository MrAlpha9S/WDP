import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "card" | "table";

export default function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
    return (
        <div className="flex items-center gap-0.5 bg-surface border border-border rounded-lg p-0.5 shrink-0">
            <button
                type="button"
                onClick={() => onChange("card")}
                title="Card view"
                className={`p-1.5 rounded-md transition-all duration-150 ${value === "card" ? "bg-white/10 text-white" : "text-gray-600 hover:text-gray-400"}`}
            >
                <LayoutGrid size={14} />
            </button>
            <button
                type="button"
                onClick={() => onChange("table")}
                title="Table view"
                className={`p-1.5 rounded-md transition-all duration-150 ${value === "table" ? "bg-white/10 text-white" : "text-gray-600 hover:text-gray-400"}`}
            >
                <List size={14} />
            </button>
        </div>
    );
}
