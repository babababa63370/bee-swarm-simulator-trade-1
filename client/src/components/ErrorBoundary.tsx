import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Une erreur est survenue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                L'application a rencontré une erreur inattendue. Veuillez rafraîchir la page.
              </p>
              {this.state.error && (
                <pre className="p-2 bg-muted rounded text-[10px] overflow-auto max-h-32 font-mono">
                  {this.state.error.message}
                </pre>
              )}
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full gap-2"
                variant="outline"
              >
                <RefreshCcw className="h-4 w-4" />
                Actualiser la page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.children;
  }
}
