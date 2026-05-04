import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children?: React.ReactNode;
}

export default function Button({ children, loading, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        background: 'linear-gradient(90deg, #0070f3 60%, #00bcd4 100%)',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 28px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,112,243,0.10)',
        transition: 'background 0.2s, transform 0.2s'
      }}
      disabled={loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}