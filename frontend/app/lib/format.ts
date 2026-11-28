// 12.5 -> "12.50" ("" for missing/invalid values)
export function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return value.toFixed(2);
}

// 1.5 -> "+1.50", -1.5 -> "-1.50"
export function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}
