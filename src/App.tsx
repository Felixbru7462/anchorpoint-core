import { Switch, Route } from 'wouter';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Settings,
} from 'lucide-react';

const DashboardHome = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
      Anchorpoint Executive Brief
    </h1>
    <p className="text-slate-500 mt-2">
      The foundation of your service infrastructure.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
          Active Vendors
        </h3>
        <p className="text-3xl font-bold mt-2 text-blue-600">0</p>
      </div>
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
          Upcoming Services
        </h3>
        <p className="text-3xl font-bold mt-2 text-blue-600">0</p>
      </div>
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h3 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">
          Record Logs
        </h3>
        <p className="text-3xl font-bold mt-2 text-blue-600">0</p>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 bg-slate-950 text-white p-6 flex flex-col shadow-xl">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black tracking-tighter text-blue-400">
            ANCHORPOINT
          </h2>
          <div className="h-1 w-8 bg-blue-500 rounded mt-1"></div>
        </div>
        <nav className="space-y-2 flex-1">
          <div className="flex items-center gap-3 bg-slate-800/50 text-blue-400 p-3 rounded-lg border border-slate-700/50 cursor-default">
            <LayoutDashboard size={20} />{' '}
            <span className="font-medium text-white">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 opacity-30 p-3 cursor-not-allowed">
            <Users size={20} /> Vendors
          </div>
        </nav>
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 opacity-30 p-3">
            <Settings size={20} /> Settings
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={DashboardHome} />
          <Route>404: Page Not Found</Route>
        </Switch>
      </main>
    </div>
  );
}
