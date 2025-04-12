// ErrorBoundary.jsx
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update status, next render will show error UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logging error messages
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error Boundary Caught on Error.", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">application error</h2>
            <p className="text-gray-700 mb-4">Sorry for the problems with the app:</p>
            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4 overflow-auto">
                <p className="text-red-600 font-mono text-sm">{this.state.error.toString()}</p>
              </div>
            )}
            {this.state.error && this.state.error.message.includes("Contract target") && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-bold">Possible reasons:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Incorrect or empty contract address</li>
                  <li>Network connectivity issues</li>
                  <li>Failure to deploy contracts correctly</li>
                </ul>
              </div>
            )}
            <div className="flex mt-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 mr-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                refresh page
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;