const displayValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return value ?? '';
};

export default function MoneyInput({ value, onChange, placeholder = '0,00', ...props }) {
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue(value)}
      onChange={(event) => onChange(event.target.value.replace(/[^\d.,-]/g, ''))}
    />
  );
}
