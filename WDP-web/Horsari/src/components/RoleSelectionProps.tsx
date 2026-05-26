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
            <label className="text-[13px] font-medium text-gray-700">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
                {roles.map((role) => (
                    <button
                        key={role.role}
                        type="button"
                        onClick={() => onChange(role)}
                        className={[
                            "px-2 py-3 rounded-xl border text-center text-[13px] font-semibold transition-all duration-150",
                            selected?.role === role.role
                                ? "border-red-800 bg-red-50 text-red-900"
                                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                        ].join(" ")}
                    >
                        {role.label}
                    </button>
                ))}
            </div>
        </div>
    );
}