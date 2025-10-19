import React from "react";

type Props = React.PropsWithChildren<{}>;
type State = { hasError: boolean; msg?: string };

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, msg: "" };

  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, msg: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown, info: unknown) {
    console.error("App crashed:", err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <pre className="text-sm opacity-80 whitespace-pre-wrap">{this.state.msg}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
