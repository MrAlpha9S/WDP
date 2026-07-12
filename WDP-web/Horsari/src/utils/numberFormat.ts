// Dot-grouped number formatting (e.g. "1.750.000.000") for VND-scale currency
// inputs, matching Vietnamese thousands-separator convention. Pairs with a
// text input (native type="number" can't render formatted digits).

export function formatWithDots(value: number | ""): string {
  if (value === "" || value == null || Number.isNaN(value)) return "";
  return value.toLocaleString("vi-VN");
}

export function parseDottedNumber(raw: string): number | "" {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? Number(digits) : "";
}
