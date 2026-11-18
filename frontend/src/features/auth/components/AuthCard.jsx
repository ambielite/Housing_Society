export default function AuthCard({ title, subtitle, children, className = '', leading, variant }) {
  const isLogin = variant === 'login';

  return (
    <main className={`auth-page${isLogin ? ' auth-page--login' : ''}`}>
      <aside className="auth-aside" aria-hidden="true">
        {isLogin ? (
          <>
            <div className="login-brand">
              <span className="login-brand-mark" aria-hidden="true">⌂</span>
              <span><strong>Ambi Elite</strong><small>HOUSING SOCIETY MANAGEMENT PLATFORM</small></span>
            </div>
            <div className="login-hero-copy">
              <h2>Housing Society<br />Management <span>System</span></h2>
              <p>Manage your society efficiently,<br />smartly and securely.</p>
              <i />
            </div>
            <div className="login-features">
              <span><b>♙</b>Residents<br />Management</span>
              <span><b>⬡</b>Secure<br />Access</span>
              <span><b>▥</b>Smart<br />Reports</span>
              <span><b>⚙</b>Efficient<br />Operations</span>
            </div>
          </>
        ) : (
          <>
            <p className="auth-aside-title">Housing Society Admin</p>
            <p className="auth-aside-text">Billing, security, helpdesk and records for your society, in one place.</p>
          </>
        )}
      </aside>
      <section className="auth-panel">
        <div className={`auth-card${isLogin ? ' auth-card--login' : ''} ${className}`.trim()}>
          {isLogin && <div className="login-security-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 4 40 10v12c0 10-6.7 17.5-16 22C14.7 39.5 8 32 8 22V10l16-6Z" fill="currentColor"/><path d="M17 20h14v12H17zM20 15h8v5h-8zM20 23v2m4-2v2m4-2v2m-8 3v3m4-3v3m4-3v3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
          {leading}
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
      </section>
    </main>
  );
}
