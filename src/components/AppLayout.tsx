import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import MobileHeader from './MobileHeader'
import DesktopHeader from './DesktopHeader'
import ToastContainer from './Toast'
import { NotificationProvider } from '../hooks/useNotifications'

// NotificationProvider lives here (not at the app root) so its logic and the
// destinations dataset it imports stay out of the public landing/auth bundle.
export default function AppLayout() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-surface">
        <SideNav />
        <MobileHeader />
        <main className="lg:ml-64">
          <DesktopHeader />
          <div className="max-w-[390px] mx-auto lg:max-w-none pt-14 pb-24 lg:pt-0 lg:pb-0 px-4 lg:px-10 lg:py-8">
            <Outlet />
          </div>
        </main>
        <BottomNav />
        <ToastContainer />
      </div>
    </NotificationProvider>
  )
}
