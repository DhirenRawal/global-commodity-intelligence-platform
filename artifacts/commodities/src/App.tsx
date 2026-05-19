import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import MapPage from "@/pages/MapPage";
import CommodityPage from "@/pages/CommodityPage";
import NewsPage from "@/pages/NewsPage";
import ComparePage from "@/pages/ComparePage";
import MethodologyPage from "@/pages/MethodologyPage";
import RiskMonitorPage from "@/pages/RiskMonitorPage";
import SanctionsPage from "@/pages/SanctionsPage";
import FlowsPage from "@/pages/FlowsPage";
import SimulatorPage from "@/pages/SimulatorPage";
import AlertsPage from "@/pages/AlertsPage";
import ReportsPage from "@/pages/ReportsPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/map" component={MapPage} />
      <Route path="/commodity/:symbol" component={CommodityPage} />
      <Route path="/risk" component={RiskMonitorPage} />
      <Route path="/sanctions" component={SanctionsPage} />
      <Route path="/flows" component={FlowsPage} />
      <Route path="/simulator" component={SimulatorPage} />
      <Route path="/compare" component={ComparePage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/methodology" component={MethodologyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
