import { Component } from 'react';

// Catches render/lazy-load errors below it so one broken page shows a message
// instead of blanking the whole app.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="max-w-xl mx-auto bg-band-ashore/10 border border-band-ashore/30 rounded-lg p-6 text-sm text-band-ashore space-y-3">
        <p className="font-semibold">Something broke on this page.</p>
        <pre className="whitespace-pre-wrap break-words text-xs bg-white/60 rounded-lg p-3">{String(error?.message || error)}</pre>
        <button onClick={() => window.location.reload()} className="underline">Reload</button>
      </div>
    );
  }
}
