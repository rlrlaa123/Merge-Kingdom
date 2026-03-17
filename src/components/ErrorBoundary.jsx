import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[Merge Kingdom Error]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 16, padding: 24,
        }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
            뭔가 잘못됐어요. 새로고침 해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: 12, color: 'white',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
