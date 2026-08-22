import React from 'react';

export default function Placeholder({ pageName }: { pageName: string }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#0f0', background: '#000', fontFamily: 'monospace' }}>
      <h2>{pageName}</h2>
      <p>[ SYSTEM: MODULE NOT FOUND ]</p>
    </div>
  );
}
