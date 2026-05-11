import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Dashboards
import DailyDashboard from './pages/DailyDashboard';
import MonthlyDashboard from './pages/MonthlyDashboard';
import YearlyDashboard from './pages/YearlyDashboard';
import StockDashboard from './pages/StockDashboard';

// Data Entry Pages
import ProductionEntry from './pages/ProductionEntry';
import StockEntry from './pages/StockEntry';
import PackingEntry from './pages/PackingEntry';
import DispatchEntry from './pages/DispatchEntry';
import EBEntry from './pages/EBEntry';

// Record Logs
import ProductionLog from './pages/ProductionLog';
import PackingLog from './pages/PackingLog';
import DispatchLog from './pages/DispatchLog';
import EnergyLog from './pages/EnergyLog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Dashboards */}
          <Route path="/" element={<DailyDashboard />} />
          <Route path="/daily" element={<DailyDashboard />} />
          <Route path="/monthly" element={<MonthlyDashboard />} />
          <Route path="/yearly" element={<YearlyDashboard />} />
          <Route path="/stock" element={<StockDashboard />} />

          {/* Data Entry */}
          <Route path="/entry/production" element={<ProductionEntry />} />
          <Route path="/entry/stock" element={<StockEntry />} />
          <Route path="/entry/packing" element={<PackingEntry />} />
          <Route path="/entry/dispatch" element={<DispatchEntry />} />
          <Route path="/entry/eb" element={<EBEntry />} />

          {/* Record Logs */}
          <Route path="/production-log" element={<ProductionLog />} />
          <Route path="/packing-log" element={<PackingLog />} />
          <Route path="/dispatch-log" element={<DispatchLog />} />
          <Route path="/energy-log" element={<EnergyLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
