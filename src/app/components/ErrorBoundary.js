'use client';

import React from 'react';
import logger, { Severity } from '../utils/errorLogger';

// ─────────────────────────────────────────────────────────────────────────────
// Full-page error boundary (wraps the whole app)
// ─────────────────────────────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.captureException(error, {
      severity: Severity.CRITICAL,
      componentStack: errorInfo?.componentStack,
      boundary: 'root',
    });
  }

  handleReset() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#06060a] text-gray-200">
          <div className="text-center space-y-4 p-8 max-w-md">
            <h2 className="text-xl font-semibold text-red-400">오류가 발생했습니다</h2>
            <p className="text-gray-400 text-sm">
              페이지를 불러오는 중 문제가 발생했습니다.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs text-red-300 bg-gray-900 p-4 rounded overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => this.handleReset()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section-level error boundary (isolates individual page sections)
// Errors here don't crash the whole app — only the wrapped area is replaced.
// ─────────────────────────────────────────────────────────────────────────────
export class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.captureException(error, {
      severity: Severity.ERROR,
      section: this.props.name ?? 'unknown',
      componentStack: errorInfo?.componentStack,
      boundary: 'section',
    });
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      return (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-center space-y-3">
          <p className="text-red-400 font-medium">
            {this.props.name ? `${this.props.name} 섹션` : '이 섹션'}에서 오류가 발생했습니다.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-left text-xs text-red-300 bg-gray-900 p-3 rounded overflow-auto max-h-32">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
