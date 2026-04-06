/**
 * @file ErrorBoundary.js
 *
 * @역할
 *   React 앱에서 렌더링 중 발생하는 예상치 못한 오류를 잡아서(catch)
 *   사용자에게 에러 화면을 보여주는 클래스 컴포넌트 모음입니다.
 *   함수형 컴포넌트로는 구현할 수 없는 React의 에러 경계(Error Boundary) 패턴을 사용합니다.
 *
 * @주요기능
 *   - ErrorBoundary: 앱 전체를 감싸는 최상위 에러 경계. 오류 발생 시 전체 화면 오류 UI 표시.
 *   - SectionErrorBoundary: 특정 섹션(구역)만 감싸는 에러 경계. 해당 구역만 오류 UI로 교체하고 나머지는 정상 동작.
 *   - 오류 발생 시 errorLogger를 통해 CRITICAL/ERROR 수준으로 기록
 *   - 개발 환경(development)에서는 상세 에러 메시지 노출
 *   - fallback prop으로 커스텀 오류 UI 지정 가능
 *
 * @관련컴포넌트
 *   - errorLogger (../utils/errorLogger): 오류 로깅 유틸리티
 *   - 루트 layout.js 또는 각 섹션 컴포넌트에서 감싸서 사용
 *
 * @사용방법
 *   // 앱 전체 보호:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 *   // 특정 섹션 보호 (name prop으로 섹션 이름 지정):
 *   <SectionErrorBoundary name="랭킹 섹션" fallback={<MyCustomFallback />}>
 *     <RankingSection />
 *   </SectionErrorBoundary>
 */
'use client';

import React from 'react';
import logger, { Severity } from '../utils/errorLogger';

// ─────────────────────────────────────────────────────────────────────────────
// Full-page error boundary (wraps the whole app)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * ErrorBoundary (전체 앱 에러 경계)
 *
 * 앱 전체를 감싸서 렌더링 오류를 잡아내는 최상위 에러 경계 컴포넌트입니다.
 * 오류 발생 시 전체 화면을 오류 UI로 교체하고, errorLogger를 통해 CRITICAL 수준으로 기록합니다.
 *
 * @prop {React.ReactNode} children - 보호할 자식 컴포넌트
 * @prop {React.ReactNode} [fallback] - 오류 시 표시할 커스텀 UI (없으면 기본 오류 화면 사용)
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    /** 오류 상태 객체: hasError(오류 발생 여부)와 error(오류 객체) */
    this.state = { hasError: false, error: null };
  }

  /**
   * 자식 컴포넌트에서 오류가 발생하면 React가 이 메서드를 호출합니다.
   * 반환값이 새 state로 병합되어 hasError를 true로 만들고 오류 화면을 표시합니다.
   * @param {Error} error - 발생한 오류 객체
   * @returns {{ hasError: boolean, error: Error }}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * 오류 발생 후 호출되는 생명주기 메서드입니다.
   * errorLogger를 통해 CRITICAL 수준으로 오류를 기록합니다.
   * @param {Error} error - 발생한 오류 객체
   * @param {React.ErrorInfo} errorInfo - 컴포넌트 스택 정보
   */
  componentDidCatch(error, errorInfo) {
    logger.captureException(error, {
      severity: Severity.CRITICAL,
      componentStack: errorInfo?.componentStack,
      boundary: 'root',
    });
  }

  /**
   * 오류 화면에서 '다시 시도' 버튼 클릭 시 호출됩니다.
   * 브라우저 환경이면 페이지 전체를 새로고침하고,
   * 서버 환경(SSR)이면 state를 초기화하여 재렌더링을 시도합니다.
   */
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
/**
 * SectionErrorBoundary (섹션 에러 경계)
 *
 * 특정 구역(섹션)만 보호하는 에러 경계 컴포넌트입니다.
 * 오류 발생 시 해당 섹션만 오류 UI로 교체하고 나머지 앱은 정상 동작합니다.
 * '다시 시도' 버튼을 누르면 페이지 새로고침 없이 해당 섹션만 재렌더링됩니다.
 *
 * @prop {React.ReactNode} children - 보호할 자식 컴포넌트
 * @prop {string} [name] - 섹션 이름 (오류 메시지 및 로그에 사용됨)
 * @prop {React.ReactNode | ((args: { error: Error, reset: () => void }) => React.ReactNode)} [fallback]
 *   - 오류 시 표시할 커스텀 UI. 함수로 전달하면 error와 reset을 인자로 받습니다.
 */
export class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    /** 오류 상태: hasError(오류 발생 여부)와 error(오류 객체) */
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  /**
   * 자식 컴포넌트에서 오류가 발생하면 React가 이 메서드를 호출합니다.
   * @param {Error} error - 발생한 오류 객체
   * @returns {{ hasError: boolean, error: Error }}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * 오류 발생 후 ERROR 수준으로 로그를 기록합니다.
   * name prop이 있으면 섹션 이름도 함께 기록합니다.
   */
  componentDidCatch(error, errorInfo) {
    logger.captureException(error, {
      severity: Severity.ERROR,
      section: this.props.name ?? 'unknown',
      componentStack: errorInfo?.componentStack,
      boundary: 'section',
    });
  }

  /**
   * 오류 화면에서 '다시 시도' 버튼 클릭 시 호출됩니다.
   * state를 초기화하여 해당 섹션만 재렌더링을 시도합니다 (페이지 새로고침 없음).
   */
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
