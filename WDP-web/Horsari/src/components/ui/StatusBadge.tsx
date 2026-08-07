export type BadgeTone =
    | "red"
    | "green"
    | "amber"
    | "blue"
    | "purple"
    | "violet"
    | "orange"
    | "teal"
    | "gold"
    | "neutral";

interface StatusBadgeProps {
    label: string;
    tone: BadgeTone;
    /** Small colored dot before the label — the app's existing convention for live/status pills. */
    dot?: boolean;
    className?: string;
}

// Generic status pill — retires the 6+ independent `Record<string, string>`
// color-map literals (STATUS_CFG, STATUS_STYLES, PHASE_BADGE, ROLE_STYLES,
// RACE_STATUS_CFG, ...) that each hand-rolled the same
// `bg-X/15 text-X border-X/30` combo per backend enum. Callers own the enum
// → tone mapping (it's domain-specific); this owns the visual rendering.
const TONE_CLASSES: Record<BadgeTone, { bg: string; text: string; border: string; dot: string }> = {
    red: { bg: "bg-red/15", text: "text-red", border: "border-red/30", dot: "bg-red" },
    green: { bg: "bg-green/15", text: "text-green", border: "border-green/30", dot: "bg-green" },
    amber: { bg: "bg-amber/15", text: "text-amber", border: "border-amber/30", dot: "bg-amber" },
    blue: { bg: "bg-blue/15", text: "text-blue", border: "border-blue/30", dot: "bg-blue" },
    purple: { bg: "bg-purple/15", text: "text-purple", border: "border-purple/30", dot: "bg-purple" },
    violet: { bg: "bg-violet/15", text: "text-violet", border: "border-violet/30", dot: "bg-violet" },
    orange: { bg: "bg-orange/15", text: "text-orange", border: "border-orange/30", dot: "bg-orange" },
    teal: { bg: "bg-teal/15", text: "text-teal", border: "border-teal/30", dot: "bg-teal" },
    gold: { bg: "bg-gold/15", text: "text-gold", border: "border-gold/30", dot: "bg-gold" },
    neutral: { bg: "bg-white/8", text: "text-text-muted", border: "border-white/15", dot: "bg-text-muted" },
};

export default function StatusBadge({ label, tone, dot = true, className }: StatusBadgeProps) {
    const cfg = TONE_CLASSES[tone];
    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-semibold whitespace-nowrap",
                cfg.bg,
                cfg.text,
                cfg.border,
                className ?? "",
            ].join(" ")}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
            {label}
        </span>
    );
}
