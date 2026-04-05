'use client';

import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] 컴포넌트 오류:', error, errorInfo);
    } else {
      console.error('[ErrorBoundary] 오류 발생:', error?.message);
    }
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
