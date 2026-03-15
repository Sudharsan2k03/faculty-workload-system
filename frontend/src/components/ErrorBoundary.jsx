import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          color: '#1e293b'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong.</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Please try refreshing the page or contact the administrator.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <pre style={{ 
              marginTop: '2rem', 
              textAlign: 'left', 
              background: '#f1f5f9', 
              padding: '1rem', 
              borderRadius: '8px',
              overflowX: 'auto',
              maxWidth: '100%'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
