import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Package,
  ClipboardEdit,
  PackageOpen,
  Truck,
  Zap,
  Activity,
  ClipboardList,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  {
    section: 'Data Entry',
    links: [
      { to: '/entry/production', icon: ClipboardEdit, label: 'Production Entry' },
      { to: '/entry/stock', icon: Package, label: 'Stock Entry' },
      { to: '/entry/packing', icon: PackageOpen, label: 'Packing Entry' },
      { to: '/entry/dispatch', icon: Truck, label: 'Dispatch Entry' },
      { to: '/entry/eb', icon: Zap, label: 'EB Entry' },
    ],
  },
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
      { to: '/production-log', icon: ClipboardList, label: 'Production Log' },
      { to: '/packing-log', icon: PackageOpen, label: 'Packing Log' },
      { to: '/dispatch-log', icon: Truck, label: 'Dispatch Log' },
      { to: '/energy-log', icon: Zap, label: 'Energy (EB) Log' },
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
