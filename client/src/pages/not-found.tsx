import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-6 p-8 text-center max-w-md">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display">404 Lost Bee</h1>
          <p className="text-muted-foreground">
            Looks like you've flown too far from the hive. This page doesn't exist.
          </p>
        </div>

        <Link href="/">
          <a className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all">
            Return to Hive
          </a>
        </Link>
      </div>
    </div>
  );
}
