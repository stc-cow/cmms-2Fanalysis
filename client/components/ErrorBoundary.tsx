import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary - Catches component errors and prevents entire app from going blank
 * This is critical for production safety - any chart or filter component failure
 * will be caught and displayed with a helpful error message
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for debugging
    console.error("Error caught by boundary:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="flex flex-col items-center gap-6 max-w-2xl">
            <div className="text-center space-y-3">
              <div className="text-6xl">⚠️</div>
              <p className="text-white font-bold text-2xl">
                Something went wrong
              </p>
              <p className="text-sm text-gray-300">
                An error occurred while rendering the dashboard
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-left w-full">
              <p className="text-sm font-semibold text-red-200 mb-3">
                🔴 Error Details:
              </p>
              <p className="text-xs text-red-100 font-mono bg-slate-900 p-2 rounded mb-2 break-all overflow-auto max-h-32">
                {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <details className="text-xs text-red-100 mt-3 cursor-pointer">
                  <summary className="font-semibold hover:text-red-50">
                    Stack trace
                  </summary>
                  <pre className="text-xs bg-slate-900 p-2 rounded mt-2 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left w-full">
              <p className="text-sm font-semibold text-blue-200 mb-3">
                💡 Troubleshooting:
              </p>
              <ol className="text-xs text-blue-100 space-y-2 list-decimal list-inside">
                <li>
                  Check the browser console for detailed error information
                </li>
                <li>Try refreshing the page</li>
                <li>Clear browser cache if the error persists</li>
                <li>Check that all API endpoints are responding</li>
              </ol>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              🔄 Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
