import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message :
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Ocorreu um erro. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Chat WAHA</h1>
          <p>Sistema de Atendimento via WhatsApp</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</h2>

          {error && <div className="auth-error">{error}</div>}

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <p>
              Ainda nao tem conta?{' '}
              <button type="button" onClick={toggleMode}>
                Criar conta
              </button>
            </p>
          ) : (
            <p>
              Ja tem uma conta?{' '}
              <button type="button" onClick={toggleMode}>
                Entrar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
