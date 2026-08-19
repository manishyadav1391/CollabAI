export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <a href="/workspaces" className="text-sm font-medium text-zinc-500">
          ← All workspaces
        </a>
      </header>
      <main>{children}</main>
    </div>
  );
}