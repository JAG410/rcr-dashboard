"use client";
import { useSession, signOut } from "next-auth/react";

interface HeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
  lastRun: string | null;
  articleCount: number;
}

export function Header({ onRefresh, refreshing, lastRun, articleCount }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-700 bg-navy-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-badge-gold">Roll Call Room</h1>
          <p className="text-gray-400 text-sm">
            {articleCount} articles ready
            {lastRun && (
              <span className="ml-2">
                · Last refresh: {new Date(lastRun).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="bg-badge-gold/20 hover:bg-badge-gold/30 text-badge-gold font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm border border-badge-gold/30"
          >
            {refreshing ? "Refreshing..." : "Fetch New Articles"}
          </button>
          {session?.user && (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">{session.user.name}</span>
              <button
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
