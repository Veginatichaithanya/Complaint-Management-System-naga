
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Menu, X, BarChart3, MessageSquare, Home, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onAuthClick: () => void;
}

export function Navbar({ onAuthClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', icon: Home, href: '#home' },
    { name: 'Ticket Dashboard', icon: BarChart3, href: '#dashboard' },
    { name: 'AI Chat Assistant', icon: MessageSquare, href: '#chat' },
    { name: 'Analytics', icon: BarChart3, href: '#analytics' },
  ];

  const handleAdminClick = () => {
    navigate('/login/admin');
    setIsOpen(false);
  };

  const handleUserAuthClick = () => {
    navigate('/login/user');
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              ComplainDesk
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </motion.a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              onClick={handleAdminClick}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin Login
            </Button>
            <Button
              onClick={handleUserAuthClick}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl"
            >
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden bg-card/50 backdrop-blur-xl rounded-2xl mt-4"
        >
          <div className="p-6 space-y-4">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5 text-emerald-600" />
                <span className="font-medium">{item.name}</span>
              </motion.a>
            ))}
            <div className="space-y-2 pt-4 border-t border-border">
              <Button
                onClick={handleAdminClick}
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl justify-start"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Login
              </Button>
              <Button
                onClick={handleUserAuthClick}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl"
              >
                Sign In
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
