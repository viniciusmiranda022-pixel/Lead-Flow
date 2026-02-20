const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyBRL(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatNumberPtBr(
  value: number,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat("pt-BR", options).format(
    Number.isFinite(value) ? value : 0,
  );
}

export function parsePtBrNumber(input: string) {
  const raw = input.trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  const hasComma = cleaned.includes(",");

  if (hasComma) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const dotParts = cleaned.split(".");
  if (dotParts.length > 2) {
    const decimal = dotParts.pop() ?? "0";
    const integer = dotParts.join("");
    const parsed = Number(`${integer}.${decimal}`);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}
