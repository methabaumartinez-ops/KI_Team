// Dashboard layout — full viewport, no chrome, no sidebar.
// The orchestrator IS the interface.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        display: "flex",
        overflow: "hidden",
        background: "var(--color-surface-primary)",
      }}
    >
      {children}
    </div>
  );
}
