'use client';

import { useState } from 'react';

const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD;

function getInitialVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('app_password_verified') === 'true';
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [isVerified] = useState(getInitialVerified);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [localVerified, setLocalVerified] = useState(false);

  const isActuallyVerified = isVerified || localVerified;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!APP_PASSWORD) {
      setError('密码未配置，请联系管理员');
      return;
    }
    if (inputPassword === APP_PASSWORD) {
      localStorage.setItem('app_password_verified', 'true');
      setLocalVerified(true);
      setError('');
    } else {
      setError('密码错误，请重试');
    }
  };

  if (isActuallyVerified) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-[#0f1115] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="锁定">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">AI 影子老师</h1>
          <p className="text-white/50 text-sm">请输入访问密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
          >
            进入
          </button>
        </form>

        <p className="text-white/30 text-xs text-center mt-6">
          保护您的 API 密钥安全
        </p>
      </div>
    </div>
  );
}