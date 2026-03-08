export function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCurrencyCompact(centavos: number): string {
  const value = centavos / 100;
  if (Math.abs(value) >= 1000) {
    return `R$${(value / 1000).toFixed(1)}k`;
  }
  return (value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
