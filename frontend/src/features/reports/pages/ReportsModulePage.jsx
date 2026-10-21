import ReportsCenterPage from '../../reports-center/pages/ReportsCenterPage';

// Keep the original /reports route stable while using Reports Center as the
// single reporting experience for every report family.
export default function ReportsModulePage() {
  return <ReportsCenterPage />;
}
