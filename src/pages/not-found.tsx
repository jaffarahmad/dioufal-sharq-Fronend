import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Compass, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Compass className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The page you're looking for doesn't exist or may have been moved.
          Check the address, or head back to the dashboard.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard">
            <Button variant="primary">
              <LayoutDashboard className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
