import Icon from './Icon'
import { useAuth, getUserInitials } from '../context/AuthContext'

export default function MobileHeader() {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 w-full max-w-[390px] h-14 bg-[#fff8f5]/80 backdrop-blur-xl flex items-center justify-between px-6 z-50 lg:hidden">
      {/* Location chip */}
      <div className="flex items-center gap-1 text-stone-600">
        <Icon name="location_on" size="18px" className="text-primary" />
        <span className="text-sm font-medium">Indonesia</span>
      </div>

      <div className="flex items-center gap-2">
        {/* User avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
          <span className="text-white text-xs font-bold">{getUserInitials(user)}</span>
        </div>
      </div>
    </header>
  )
}
