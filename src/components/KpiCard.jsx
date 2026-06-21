export default function KpiCard({ title, value, description, tone = 'neutral' }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      {description && <small>{description}</small>}
    </article>
  );
}
