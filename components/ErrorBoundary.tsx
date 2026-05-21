/**
 * ErrorBoundary.tsx
 * Catches render errors in stage components and shows a recoverable message.
 */

"use client";

import React, { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  stageName?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

/**
 * Class error boundary for client stage trees.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-lg p-6">
          <p className="font-semibold">
            Something went wrong{this.props.stageName ? ` in ${this.props.stageName}` : ""}.
          </p>
          <p className="text-sm mt-2">{this.state.message}</p>
          <button
            type="button"
            className="mt-4 px-4 py-2 border border-red-300 rounded text-sm"
            onClick={() => this.setState({ hasError: false, message: "" })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
