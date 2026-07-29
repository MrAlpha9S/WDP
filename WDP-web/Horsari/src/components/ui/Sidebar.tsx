import type { ReactNode } from "react";

export interface SidebarItem<T extends string> {
    key: T;
    label: string;
    icon: ReactNode;
    badge?: number;
}

export interface SidebarGroup<T extends string> {
    label?: string;
    items: SidebarItem<T>[];
}

interface SidebarProps<T extends string> {
    title: string;
    subtitle: string;
    groups: SidebarGroup<T>[];
    activeKey: T;
    onSelect: (key: T) => void;
}

export default function Sidebar<T extends string>({
    title,
    subtitle,
    groups,
    activeKey,
    onSelect,
}: SidebarProps<T>) {
    return (
        <aside className="w-[200px] shrink-0 min-h-0 bg-surface border-r border-border flex flex-col pt-7 pb-6 font-sans overflow-y-auto custom-scrollbar">
            <div className="px-5 mb-6">
                <p className="text-[13px] font-semibold text-text leading-tight">{title}</p>
                <p className="text-[10px] font-bold tracking-[0.16em] text-text-muted uppercase mt-0.5 font-mono">
                    {subtitle}
                </p>
            </div>

            <nav className="flex flex-col gap-5 px-3">
                {groups.map((group, gi) => (
                    <div key={group.label ?? gi}>
                        {group.label && (
                            <p className="text-[9.5px] font-bold tracking-[0.16em] text-text-muted/70 uppercase px-3 mb-1.5 font-mono">
                                {group.label}
                            </p>
                        )}
                        <div className="flex flex-col gap-0.5">
                            {group.items.map(({ key, label, icon, badge }) => {
                                const isActive = key === activeKey;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => onSelect(key)}
                                        className={`relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-md text-[13.5px] font-medium transition-all duration-150 w-full text-left border-l-[3px] cursor-pointer ${isActive
                                            ? "border-gold bg-surface-raised text-gold"
                                            : "border-transparent text-text-muted hover:text-text hover:bg-surface-raised/60"
                                            }`}
                                    >
                                        <span className={isActive ? "text-gold" : "text-text-muted"}>{icon}</span>
                                        <span className="flex-1">{label}</span>
                                        {badge != null && badge > 0 && (
                                            <span className="ml-auto w-4 h-4 bg-red rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0">
                                                {badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
