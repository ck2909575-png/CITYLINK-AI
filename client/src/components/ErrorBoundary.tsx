import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[UrbanShield Recovery Mesh] Uncaught UI render error caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-950/90 border border-red-500/30 rounded-2xl m-4 shadow-2xl">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40 font-bold">
                TELEMETRY RECOVERY LAYER
              </span>
              <h2 className="text-lg font-bold text-white font-mono">
                {this.props.fallbackTitle || 'UrbanShield Safe-State Activated'}
              </h2>
              <p className="text-xs text-slate-400">
                A transient rendering anomaly was isolated. The platform state is preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left font-mono text-[11px] text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono text-xs font-bold rounded-xl transition shadow-lg shadow-red-950 flex items-center justify-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RECONNECT COMMAND MESH</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
