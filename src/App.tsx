
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import UserAuth from "./pages/UserAuth";
import AdminAuth from "./pages/AdminAuth";
import MeetingSchedulerPage from "./pages/MeetingScheduler";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/user" element={<UserAuth />} />
            <Route path="/login/admin" element={<AdminAuth />} />
            <Route path="/dashboard/user" element={<Index />} />
            <Route path="/dashboard/admin" element={<Admin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/user-auth" element={<UserAuth />} />
            <Route path="/schedule-meeting" element={<MeetingSchedulerPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
