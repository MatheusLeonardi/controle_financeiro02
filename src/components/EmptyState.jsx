export default function EmptyState({ title = 'Nenhum registro encontrado', text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {text && <span>{text}</span>}
    </div>
  );
}
