export type Role = {
    role: string;
    label: string;
};

export interface RoleSelectorProps {
    roles: Role[];
    selected: Role | null;
    onChange: (role: Role) => void;
}

export function RoleSelector({ roles, selected, onChange }: RoleSelectorProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-text-muted tracking-wider uppercase">Role</label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Role">
                {roles.map((role) => (
                    <button
                        key={role.role}
                        type="button"
                        role="radio"
                        aria-checked={selected?.role === role.role}
                        onClick={() => onChange(role)}
                        className={[
                            "px-2 py-3 rounded-lg border text-center text-[13px] font-semibold transition-all duration-150 cursor-pointer",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                            selected?.role === role.role
                                ? "border-brand bg-brand-tint text-brand"
                                : "border-border text-text-muted hover:border-white/25 hover:text-text",
                        ].join(" ")}
                    >
                        {role.label}
                    </button>
                ))}
            </div>
        </div>
    );
}