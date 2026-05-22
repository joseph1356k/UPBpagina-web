/**
 * Auth layout — minimal shell for login/recovery pages.
 *
 * No sidebar, no admin chrome. Centered content with the institutional
 * gold ribbon at the top for brand cohesion.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-brand-surface/40">
      {/* Gold accent ribbon */}
      <div
        aria-hidden
        className="h-0.5 shrink-0 bg-gradient-to-r from-primary via-brand-gold to-primary"
      />
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-12"
      >
        {children}
      </main>
    </div>
  );
}
