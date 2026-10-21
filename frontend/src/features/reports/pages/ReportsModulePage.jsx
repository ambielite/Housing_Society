import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../../app/providers/useAuth';
import ReportsCenterPage from '../../reports-center/pages/ReportsCenterPage';
import ReportsWorkspace from './ReportsWorkspace';

const CORE_REPORT_PERMISSIONS = [
  'REPORT_DASHBOARD_READ', 'REPORT_FINANCE_READ', 'REPORT_OPERATIONS_READ',
  'REPORT_SECURITY_READ', 'REPORT_APPROVAL_READ',
];
const CENTER_REPORT_PERMISSIONS = [
  'REPORT_DASHBOARD_READ', 'REPORT_OPERATIONS_READ', 'REPORT_SECURITY_READ',
  'REPORT_HELPDESK_READ', 'REPORT_VENDOR_READ', 'REPORT_PROCUREMENT_READ',
  'REPORT_AMENITY_READ', 'REPORT_UTILITY_READ',
];

export default function ReportsModulePage() {
  const { pathname } = useLocation();
  const { hasAnyPermission } = useAuth();
  const canSeeCore = hasAnyPermission(CORE_REPORT_PERMISSIONS);
  const canSeeCenter = hasAnyPermission(CENTER_REPORT_PERMISSIONS);
  const showCenter = pathname === '/reports-center' ? canSeeCenter : !canSeeCore && canSeeCenter;

  return (
    <>
      {(canSeeCore && canSeeCenter) && (
        <nav className="reports-tabs reports-module-tabs" aria-label="Reports modules">
          <Link to="/reports" className={!showCenter ? 'active' : ''} aria-current={!showCenter ? 'page' : undefined}>Reports & insights</Link>
          <Link to="/reports-center" className={showCenter ? 'active' : ''} aria-current={showCenter ? 'page' : undefined}>Reports Center</Link>
        </nav>
      )}
      {showCenter ? <ReportsCenterPage /> : <ReportsWorkspace />}
    </>
  );
}
