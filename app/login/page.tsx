"use client";
import { Suspense, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { fetchJson, setToken, getToken } from '../../lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const search = useSearchParams();

  const redirectTo = search?.get('redirect') || '/processes';

  useEffect(() => {
    // If already logged in, redirect
    if (getToken()) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJson<{ result: { access_token: string } }>(
        '/api/core/auth/signin',
        {
          method: 'POST',
          body: { username, password },
        },
      );
      const token = (res as any).result?.access_token;
      if (!token) throw new Error('No access token received');
      setToken(token);
      // Use hard navigation to ensure cookie is present for middleware on first load
      window.location.href = redirectTo;
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={login} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-slate-800">Sign in</h1>
        {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <div className="mb-3">
          <label className="mb-1 block text-sm text-slate-600">Username</label>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm text-slate-600">Password</label>
          <input
            type="password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
