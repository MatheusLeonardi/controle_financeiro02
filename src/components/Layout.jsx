import { supabase } from '../lib/supabase';

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rendas', label: 'Rendas' },
  { id: 'gastos', label: 'Gastos' },
  { id: 'cartoes', label: 'Cartões' },
  { id: 'fatura', label: 'Fatura' },
  { id: 'parceladas', label: 'Compras Parceladas' },
  { id: 'previsao', label: 'Previsão Financeira' },
  { id: 'metas', label: 'Metas' },
];

export default function Layout({ activePage, setActivePage, profile, userEmail, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CF</span>
          <div>
            <strong>Controle Financeiro</strong>
            <small>{profile?.nome || userEmail}</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Menu principal">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activePage === item.id ? 'active' : ''}
              onClick={() => setActivePage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="ghost-button logout" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </aside>

      <main className="content-shell">{children}</main>
    </div>
  );
}
