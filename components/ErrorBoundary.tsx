import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>Что-то пошло не так</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 400 }}>Произошла ошибка при загрузке страницы. Попробуйте обновить или вернуться на главную.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Повторить
            </button>
            <a
              href="/"
              style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, background: 'rgba(0,0,0,0.05)', color: 'var(--ink)', textDecoration: 'none' }}
            >
              На главную
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
