"use client";
import { useEffect, useState } from 'react';
import { getApiBase, getToken, setApiBase, setToken } from '../lib/api';

export function ApiSettings() {
  const [base, setBase] = useState('');
  const [token, setTok] = useState('');

  useEffect(() => {
    setBase(getApiBase());
    setTok(getToken());
  }, []);

  return (
    <div className="ml-auto hidden items-center gap-2 md:flex">
      <input
        placeholder="API Base (e.g. http://localhost:3000/v1)"
        value={base}
        onChange={(e) => setBase(e.target.value)}
        onBlur={() => setApiBase(base)}
        className="h-9 w-72 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-400"
      />
      <input
        placeholder="Bearer Token"
        value={token}
        onChange={(e) => setTok(e.target.value)}
        onBlur={() => setToken(token)}
        className="h-9 w-64 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-400"
      />
    </div>
  );
}
