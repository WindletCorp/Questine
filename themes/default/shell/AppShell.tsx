import React from 'react';
import type { AppShellProps } from '../../contract';

export function LoadingState() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ animation: 'spin 1s linear infinite', border: '2px solid #ccc', borderTop: '2px solid #000', borderRadius: '50%', width: '2rem', height: '2rem' }} />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="default-theme-shell">
      {children}
    </div>
  );
}
