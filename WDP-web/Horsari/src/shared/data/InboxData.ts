// ── Race type descriptions ─────────────────────────────────────────────────────
// RaceType is backend free text (no fixed enum) — this is a best-effort glossary
// for the known canonical categories; unrecognized values fall back gracefully.

export const RACE_TYPE_DESCRIPTIONS: Record<string, string> = {
    Stakes: "Top tier — highest prize money.",
    Allowance: "Mid-level — horses that have won but aren't ready for stakes.",
    Claims: "Any owner can purchase a horse at the listed price before the race.",
    Maiden: "For horses that have never won a race.",
};
