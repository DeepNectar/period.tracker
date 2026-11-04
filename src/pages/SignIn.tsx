import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/useAppStore';

interface FormData {
  email: string;
  password: string;
}

export default function SignIn() {
  const [error, setError] = useState('');
  const login = useAppStore(s => s.login);
  const addToast = useAppStore(s => s.addToast);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setError('');
    const success = await login(data.email, data.password);
    if (success) {
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/20 rounded-2xl mb-4">
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Bloom</h1>
          <p className="text-rose-200 mt-1">Privacy-first period tracker</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-rose-200 mb-1">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-rose-200 mb-1">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-500 hover:bg-rose-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-rose-200 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-rose-300 hover:text-white font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-rose-300/60 text-xs mt-6">
          🔒 Your data stays on your device by default
        </p>
      </div>
    </div>
  );
}
