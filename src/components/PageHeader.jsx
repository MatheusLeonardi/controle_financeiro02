export default function PageHeader({ title, description, aside }) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">Financeiro pessoal</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {aside}
    </header>
  );
}
