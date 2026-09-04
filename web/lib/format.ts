/**
 * Indian currency and score formatting utilities.
 */

export function formatINR(money: string | number): string {
  const num = typeof money === "string" ? parseFloat(money) : money;
  if (isNaN(num)) return "₹0.00";

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const parts = absNum.toFixed(2).split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let grouped = "";
  if (integerPart.length <= 3) {
    grouped = integerPart;
  } else {
    const last3 = integerPart.slice(-3);
    let rest = integerPart.slice(0, -3);
    const groups: string[] = [];
    while (rest.length > 2) {
      groups.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest.length > 0) {
      groups.unshift(rest);
    }
    grouped = groups.join(",") + "," + last3;
  }

  const sign = isNegative ? "-" : "";
  return `${sign}₹${grouped}.${decimalPart}`;
}

export function formatPercent(ratio: string | number, dp = 1): string {
  const num = typeof ratio === "string" ? parseFloat(ratio) : ratio;
  if (isNaN(num)) return "0.0%";
  return `${num.toFixed(dp)}%`;
}

export function bandColor(band: string): string {
  switch (band?.toLowerCase()) {
    case "critical":
    case "at risk":
      return "text-red-500";
    case "fair":
      return "text-amber-400";
    case "healthy":
    case "strong":
      return "text-primary"; // Vibrant purple accent
    default:
      return "text-foreground";
  }
}

export function bandBadgeClass(band: string): string {
  switch (band?.toLowerCase()) {
    case "critical":
    case "at risk":
      return "bg-red-950/40 text-red-400 border border-red-800/40";
    case "fair":
      return "bg-amber-950/40 text-amber-400 border border-amber-800/40";
    case "healthy":
    case "strong":
      return "bg-primary/20 text-purple-300 border border-primary/40";
    default:
      return "bg-secondary text-muted-foreground border border-border";
  }
}

export function toNumber(money: string | number | undefined | null): number {
  if (money === undefined || money === null) return 0;
  if (typeof money === "number") return money;
  return parseFloat(money) || 0;
}


