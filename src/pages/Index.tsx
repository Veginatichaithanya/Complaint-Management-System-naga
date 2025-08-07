
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthCard } from "@/components/AuthCard";
import Dashboard from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";
import { Navbar } from "@/components/Navbar";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user?.email === 'admin@gmail.com';

  if (user) {
    // If admin, show admin panel in full screen, otherwise show regular dashboard
    if (isAdmin) {
      return (
        <div className="min-h-screen w-full">
          <AdminPanel />
        </div>
      );
    } else {
      return <Dashboard />;
    }
  }

  return (
    <>
      <Navbar onAuthClick={() => setShowAuth(true)} />
      <LandingPage />
      
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAuth(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <AuthCard onSuccess={() => setShowAuth(false)} />
              <button
                onClick={() => setShowAuth(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;
