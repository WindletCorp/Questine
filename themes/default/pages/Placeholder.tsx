import React from 'react';

export default function Placeholder({ pageName }: { pageName: string }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{pageName}</h2>
      <p>This page is not yet implemented in the current theme.</p>
    </div>
  );
}
