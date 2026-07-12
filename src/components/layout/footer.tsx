export default function Footer() {
  return (
    <footer className="mt-auto shrink-0 border-t border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Diouf Al-Sharq Construction. All rights
          reserved.
        </p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Construction Management System
        </p>
      </div>
    </footer>
  );
}
