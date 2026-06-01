import React from "react";
import { Link } from "wouter";
import { Scissors, Settings } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background text-foreground overflow-hidden">
      <header className="h-14 border-b border-border flex items-center px-4 md:px-6 shrink-0 bg-card">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Scissors className="h-5 w-5 text-primary" />
          <span className="font-bold tracking-tight">SubGen</span>
        </Link>
        <div className="ml-auto">
          <Link href="/settings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
