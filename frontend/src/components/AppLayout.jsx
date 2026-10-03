import AppNavbar from './AppNavbar';
import AppFooter from './AppFooter';

/** Shell for authenticated pages: navbar, a centred <main> and the app footer. */
const AppLayout = ({ className = '', children }) => (
  <div className="app-layout">
    <AppNavbar />
    <main id="main-content" className={`app-main ${className}`.trim()}>
      {children}
    </main>
    <AppFooter />
  </div>
);

export default AppLayout;
