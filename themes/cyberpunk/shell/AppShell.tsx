import React from 'react';
import type { AppShellProps } from '../../contract';

export function LoadingState() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#0f0', fontFamily: 'monospace' }}>
      <p>LOADING MODULES...</p>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#0f0', fontFamily: 'monospace' }}>
      <header style={{ padding: '1rem', borderBottom: '1px solid #0f0' }}>
        <strong>&gt; QUESTINE TERMINAL v0.1</strong>
      </header>
      <main style={{ padding: '1rem' }}>
        {children}
      </main>
      
      {/* Scanline overlay */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%',
        pointerEvents: 'none', zIndex: 9999
      }} />
    </div>
  );
}
