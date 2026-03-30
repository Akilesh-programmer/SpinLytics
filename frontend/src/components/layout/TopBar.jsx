import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import './TopBar.css';

const pageTitles = {
  '/': 'Daily Dashboard',
  '/monthly': 'Monthly Dashboard',
  '/yearly': 'Yearly Dashboard',
  '/stock': 'Stock Dashboard',
  '/production': 'Production Log',
  '/packing': 'Packing Log',
  '/dispatch': 'Dispatch Log',
  '/energy': 'Energy (EB) Log',
};

export default function TopBar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const title = pageTitles[location.pathname] || 'Dashboard';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar" id="topbar">
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          SpinLytics <span>/ {title}</span>
        </div>
      </div>
      <div className="topbar-right">
        <span className="topbar-time">
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
}
