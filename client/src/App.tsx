import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Workspace from "./pages/Workspace";
import DashboardLayout from "./components/DashboardLayout";

function ToolRoute({ section }: { section: Parameters<typeof Workspace>[0]["section"] }) {
  return <DashboardLayout><Workspace section={section} /></DashboardLayout>;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/trends"><ToolRoute section="trends" /></Route>
    <Route path="/library"><ToolRoute section="library" /></Route>
    <Route path="/studio"><ToolRoute section="studio" /></Route>
    <Route path="/review"><ToolRoute section="review" /></Route>
    <Route path="/automation"><ToolRoute section="automation" /></Route>
    <Route path="/insights"><ToolRoute section="insights" /></Route>
    <Route path="/evolution"><ToolRoute section="evolution" /></Route>
    <Route path="/settings"><ToolRoute section="settings" /></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark" richColors position="top-left" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
