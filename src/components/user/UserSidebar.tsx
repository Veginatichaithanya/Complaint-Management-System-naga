
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Plus, 
  Ticket, 
  Bot, 
  Bell, 
  User, 
  LogOut,
  X,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

type PageType = 'home' | 'raise-complaint' | 'my-complaints' | 'chatbot' | 'notifications' | 'profile' | 'admin-meetings';

interface UserSidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function UserSidebar({ currentPage, onPageChange, isOpen, onClose }: UserSidebarProps) {
  const { signOut } = useAuth();

  const menuItems = [
    { id: 'home' as PageType, label: 'Home', icon: Home },
    { id: 'raise-complaint' as PageType, label: 'Raise Complaint', icon: Plus },
    { id: 'my-complaints' as PageType, label: 'My Tickets', icon: Ticket },
    { id: 'admin-meetings' as PageType, label: 'All Admin Meetings', icon: Calendar },
    { id: 'chatbot' as PageType, label: 'AI Assistant', icon: Bot },
    { id: 'notifications' as PageType, label: 'Notifications', icon: Bell },
    { id: 'profile' as PageType, label: 'Profile', icon: User },
  ];

  const handleItemClick = (pageId: PageType) => {
    onPageChange(pageId);
    onClose(); // Close mobile sidebar
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white/90 backdrop-blur-xl border-r border-border/50 z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ComplainDesk
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  currentPage === item.id 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => handleItemClick(item.id)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="lg:hidden fixed left-0 top-0 h-screen w-80 bg-white/95 backdrop-blur-xl border-r border-border/50 z-50"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ComplainDesk
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  currentPage === item.id 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => handleItemClick(item.id)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
