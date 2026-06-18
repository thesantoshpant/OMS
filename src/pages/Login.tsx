import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      /* error handled by store */
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex items-center justify-center px-4">
      <div className="w-full max-w-[360px] border border-line">
        <div className="border-b border-line px-4 py-3 text-center">
          <span className="mono font-bold text-accent text-[16px] tracking-tight">OMS</span>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="text-center label-caps">Sign in</div>
          {error && <div className="border border-ask/40 bg-ask/10 text-ask text-[11px] mono p-2">{String(error)}</div>}
          <div className="flex flex-col gap-1">
            <label className="label-caps">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="term-input !text-left"
              placeholder="user@firm.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label-caps">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="term-input !text-left"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 text-[12px] font-semibold bg-accent-strong !text-[#00285d] hover:brightness-110 disabled:opacity-50"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="text-center text-[12px] text-outline">
            Don't have an account?{' '}
            <Link to="/signup" className="!text-accent hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
