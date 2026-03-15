import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, Presentation, 
  CalendarPlus, Database, LogOut, BarChart,
  ChevronLeft, ChevronRight, Menu, Building2, DraftingCompass, X
} from 'lucide-react';

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuGroups = [
    {
      title: 'Main',
      items: [
        { path: '/admin', name: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true }
      ]
    },
    {
      title: 'Management',
      items: [
        { path: '/admin/departments', name: 'Departments', icon: <Building2 size={20} /> },
        { path: '/admin/subjects', name: 'Subjects', icon: <BookOpen size={20} /> },
        { path: '/admin/room-types', name: 'Room Types', icon: <DraftingCompass size={20} /> },
        { path: '/admin/classrooms', name: 'Classrooms', icon: <Presentation size={20} /> },
        { path: '/admin/faculty', name: 'Faculty', icon: <Users size={20} /> }
      ]
    },
    {
      title: 'Scheduling',
      items: [
        { path: '/admin/workload', name: 'Workload Allocation', icon: <Database size={20} /> },
        { path: '/admin/timetable', name: 'Timetable Generator', icon: <CalendarPlus size={20} /> }
      ]
    },
    {
      title: 'Analytics',
      items: [
        { path: '/admin/reports', name: 'Reports', icon: <BarChart size={20} /> }
      ]
    }
  ];

  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD';

  return (
    <div className="app-container">
      {/* Mobile Top Navbar */}
      <header className="mobile-header">
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-app-title">Faculty Workload System</div>
        <div className="mobile-user-avatar">{userInitials}</div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay-mobile" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Admin Panel</div>
          <button className="collapse-btn desktop-only" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button className="mobile-only close-sidebar-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-nav">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="sidebar-section">
              <div className="sidebar-section-title">{group.title}</div>
              {group.items.map((item, itemIdx) => (
                <NavLink 
                  key={itemIdx} 
                  to={item.path} 
                  end={item.end}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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
              <span className="user-name">{user?.name || 'Administrator'}</span>
              <span className="user-role">System Admin</span>
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

export default AdminLayout;
