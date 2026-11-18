import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="admin-footer" aria-label="Site information">
          <span className="footer-copyright">© {new Date().getFullYear()} Housing Society Management Platform</span>
          <nav className="footer-links" aria-label="Footer links">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Help centre</span>
          </nav>
          <span className="footer-status"><i aria-hidden="true" />All systems operational</span>
          <span className="footer-credit">Powered by <strong>Ambi Elite</strong></span>
        </footer>
      </div>
    </div>
  );
}
