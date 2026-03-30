import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DailyDashboard from './pages/DailyDashboard';
import MonthlyDashboard from './pages/MonthlyDashboard';
import YearlyDashboard from './pages/YearlyDashboard';
import StockDashboard from './pages/StockDashboard';
import ProductionLog from './pages/ProductionLog';
import PackingLog from './pages/PackingLog';
import DispatchLog from './pages/DispatchLog';
import EnergyLog from './pages/EnergyLog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DailyDashboard />} />
          <Route path="/daily" element={<DailyDashboard />} />
          <Route path="/monthly" element={<MonthlyDashboard />} />
          <Route path="/yearly" element={<YearlyDashboard />} />
          <Route path="/stock" element={<StockDashboard />} />
          <Route path="/production" element={<ProductionLog />} />
          <Route path="/packing" element={<PackingLog />} />
          <Route path="/dispatch" element={<DispatchLog />} />
          <Route path="/energy" element={<EnergyLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
