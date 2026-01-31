import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopNav } from "@/components/TopNav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ValueList from "@/pages/ValueList";
import News from "@/pages/News";
import Codes from "@/pages/Codes";
import Contents from "@/pages/Contents";
import Staff from "@/pages/Staff";
import Login from "@/pages/Login";
import GroupTracking from "@/pages/GroupTracking";
import AdminPanel from "@/pages/AdminPanel";
import CreatorPanel from "@/pages/CreatorPanel";
import { GlobalSnowfall } from "@/components/GlobalSnowfall";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Router() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  if (isLoginPage) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
      </Switch>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background text-foreground font-body selection:bg-primary/30 relative">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <GlobalSnowfall />
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <div className="flex-1">
              <TopNav />
            </div>
          </header>
          <main className="flex-1 bg-honeycomb scroll-smooth overflow-y-auto">
            <div className="container mx-auto p-4 md:p-8 pb-20">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/values" component={ValueList} />
                <Route path="/staff" component={Staff} />
                <Route path="/tracking" component={GroupTracking} />
                <Route path="/news" component={News} />
                <Route path="/contents" component={Contents} />
                <Route path="/contents/:channelId" component={Contents} />
                <Route path="/codes" component={Codes} />
                <Route path="/admin" component={AdminPanel} />
                <Route path="/creator" component={CreatorPanel} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
