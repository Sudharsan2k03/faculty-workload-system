import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, CalendarRange, Book, User as UserIcon, LogOut,
  ChevronLeft, Menu, X
} from 'lucide-react';

const FacultyLayout = () => {
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuGroups = [
    {
      title: 'Main',
      items: [
        { path: '/faculty', name: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true }
      ]
    },
    {
      title: 'Academics',
      items: [
        { path: '/faculty?tab=schedule', name: 'Weekly Timetable', icon: <CalendarRange size={20} /> },
        { path: '/faculty?tab=subjects', name: 'Assigned Subjects', icon: <Book size={20} /> }
      ]
    },
    {
      title: 'Profile',
      items: [
        { path: '/faculty?tab=profile', name: 'My Profile', icon: <UserIcon size={20} /> }
      ]
    }
  ];

  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'FT';

  return (
    <div className="app-container">
      {/* Mobile Top Navbar */}
      <header className="mobile-header">
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-app-title">Faculty Portal</div>
        <div className="mobile-user-avatar">{userInitials}</div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay-mobile" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Faculty Portal</div>
          <div className="flex items-center gap-2">
            <button className="collapse-btn desktop-only" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button className="mobile-only close-sidebar-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="sidebar-nav">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="sidebar-section">
              <div className="sidebar-section-title">{group.title}</div>
              {group.items.map((item, itemIdx) => (
                <NavLink 
                  key={itemIdx} 
                  to={item.path} 
                  className={({ isActive }) => {
                    // Custom active check for query params and root
                    const currentUrl = window.location.pathname + window.location.search;
                    const cleanPath = item.path.split('?')[0];
                    const itemActive = currentUrl === item.path || (item.end && window.location.pathname === cleanPath && (window.location.search === '' || window.location.search === '?tab=overview'));
                    return `nav-item ${itemActive ? 'active' : ''}`;
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-tooltip={item.name}
                >
                  <div className="nav-icon">{item.icon}</div>
                  <span className="nav-label">{item.name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{userInitials}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Faculty Member'}</span>
              <span className="user-role">Education Expert</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn-styled" title="Logout Session">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default FacultyLayout;
