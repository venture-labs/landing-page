import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Page language, from the route (the boundary sits outside the i18n provider's reach). */
  lang?: "de" | "en";
}

const COPY = {
  de: {
    title: "Diese Seite konnte nicht geladen werden",
    body: "Bitte lade die Seite neu oder kehre zur Startseite zurück.",
  },
  en: {
    title: "This page could not be loaded",
    body: "Please reload the page or go back to the home page.",
  },
};

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in page render:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0d13] text-white px-6">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold mb-3">{COPY[this.props.lang ?? "de"].title}</h1>
            <p className="text-white/60 text-sm">{COPY[this.props.lang ?? "de"].body}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
