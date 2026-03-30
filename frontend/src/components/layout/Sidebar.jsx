import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Package,
  ClipboardList,
  PackageOpen,
  Truck,
  Zap,
  Activity,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  {
    section: 'Dashboards',
    links: [
      { to: '/', icon: LayoutDashboard, label: 'Daily Dashboard' },
      { to: '/monthly', icon: CalendarDays, label: 'Monthly Dashboard' },
      { to: '/yearly', icon: CalendarRange, label: 'Yearly Dashboard' },
    ],
  },
  {
    section: 'Inventory',
    links: [
      { to: '/stock', icon: Package, label: 'Stock Dashboard' },
    ],
  },
  {
    section: 'Records',
    links: [
      { to: '/production', icon: ClipboardList, label: 'Production Log' },
      { to: '/packing', icon: PackageOpen, label: 'Packing Log' },
      { to: '/dispatch', icon: Truck, label: 'Dispatch Log' },
      { to: '/energy', icon: Zap, label: 'Energy (EB) Log' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar" id="sidebar-nav">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Activity />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">SpinLytics</span>
          <span className="sidebar-brand-sub">Production Analytics</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="sidebar-section" key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <link.icon />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="sidebar-status-dot" />
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
}
