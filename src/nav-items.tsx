
import { HomeIcon } from "lucide-react";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import MeetingSchedulerPage from "./pages/MeetingScheduler";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  // Admin route still exists but not in navbar
  {
    title: "Admin",
    to: "/admin", 
    icon: null,
    page: <Admin />,
  },
  // Meeting scheduler route (not shown in navbar)
  {
    title: "Schedule Meeting",
    to: "/schedule-meeting",
    icon: null,
    page: <MeetingSchedulerPage />,
  },
];
