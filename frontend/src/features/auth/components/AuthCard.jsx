export default function AuthCard({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside" aria-hidden="true">
        <p className="auth-aside-title">Housing Society Admin</p>
        <p className="auth-aside-text">Billing, security, helpdesk and records for your society, in one place.</p>
      </aside>
      <section className="auth-panel">
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
      </section>
    </main>
  );
}
