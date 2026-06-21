import { useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nome: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const request =
      mode === 'login'
        ? supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          })
        : supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
              data: {
                nome: form.nome,
              },
            },
          });

    const { error } = await request;
    if (error) {
      setMessage(error.message);
    } else if (mode === 'cadastro') {
      setMessage('Cadastro criado. Se o Supabase pedir confirmação, confira seu e-mail.');
    }

    setLoading(false);
  };

  if (!hasSupabaseConfig) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <span className="eyebrow">Configuração necessária</span>
          <h1>Controle Financeiro</h1>
          <p>
            Crie um arquivo <strong>.env</strong> com VITE_SUPABASE_URL e
            VITE_SUPABASE_ANON_KEY antes de iniciar o app.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Controle financeiro pessoal</span>
        <h1>{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</h1>
        <p>Organize renda, gastos, cartões, faturas e parcelas por pessoa.</p>

        <form className="form-grid single" onSubmit={submit}>
          {mode === 'cadastro' && (
            <label>
              Nome
              <input
                value={form.nome}
                onChange={(event) => update('nome', event.target.value)}
                placeholder="Seu nome"
                required
              />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="voce@email.com"
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) => update('password', event.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </label>
          {message && <p className="form-message">{message}</p>}
          <button className="primary-button" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <button
          type="button"
          className="link-button center"
          onClick={() => {
            setMessage('');
            setMode(mode === 'login' ? 'cadastro' : 'login');
          }}
        >
          {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </section>
    </main>
  );
}
