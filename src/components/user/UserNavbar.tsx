
import React from 'react';
import { motion } from 'framer-motion';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from '@/components/ui/notification-dropdown';

interface UserNavbarProps {
  onMenuClick: () => void;
  currentPage: string;
}

export function UserNavbar({ onMenuClick, currentPage }: UserNavbarProps) {
  const getPageTitle = (page: string) => {
    switch (page) {
      case 'home': return 'Dashboard';
      case 'raise-complaint': return 'Raise Complaint';
      case 'my-complaints': return 'My Complaints';
      case 'chatbot': return 'AI Assistant';
      case 'notifications': return 'Notifications';
      case 'profile': return 'Profile';
      default: return 'Dashboard';
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-white/90 backdrop-blur-xl border-b border-border/50"
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {getPageTitle(currentPage)}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
