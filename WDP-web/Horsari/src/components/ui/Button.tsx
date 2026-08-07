import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    className?: string;
}

// Canonical action button — retires the ad hoc `bg-red-700 hover:bg-red-600
// disabled:...` inline class strings scattered per-page (see Jockeys.tsx
// "Hire" button, Admin modals' confirm/cancel footers, etc.). Every call site
// should be able to express itself as variant + size + loading, nothing more.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: "bg-red text-white hover:bg-red/85 shadow-lg shadow-black/20 disabled:bg-surface-raised disabled:text-text-muted disabled:shadow-none",
    secondary: "bg-surface-raised text-text border border-border hover:border-white/25 disabled:text-text-muted disabled:hover:border-border",
    destructive: "bg-red text-white hover:bg-red/85 shadow-lg shadow-red-900/20 disabled:bg-surface-raised disabled:text-text-muted disabled:shadow-none",
    ghost: "bg-transparent text-text-muted border border-white/12 hover:border-white/28 hover:text-text disabled:hover:border-white/12 disabled:hover:text-text-muted",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-[11.5px] rounded-md gap-1.5",
    md: "px-4 py-2.5 text-[13px] rounded-lg gap-2",
};

export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    className,
    ...rest
}: ButtonProps) {
    const isDisabled = disabled || loading;
    return (
        <button
            type="button"
            disabled={isDisabled}
            aria-busy={loading || undefined}
            className={[
                "inline-flex items-center justify-center font-semibold transition-all duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                isDisabled ? "cursor-not-allowed" : "cursor-pointer",
                VARIANT_CLASSES[variant],
                SIZE_CLASSES[size],
                className ?? "",
            ].join(" ")}
            {...rest}
        >
            {loading ? (
                <Loader2 size={size === "sm" ? 12 : 14} className="animate-spin" />
            ) : (
                leftIcon
            )}
            {children != null && <span>{children}</span>}
            {!loading && rightIcon}
        </button>
    );
}
