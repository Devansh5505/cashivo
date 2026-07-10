export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  AED: "د.إ",
};

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${symbol}${formatted}`;
}

export function formatCompact(amount: number, currency: string = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${symbol}${abs.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
}
