
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";
import { Navbar } from "@/components/Navbar";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  const handleAuthClick = () => {
    navigate('/login/user');
  };

  return (
    <>
      <Navbar onAuthClick={handleAuthClick} />
      <LandingPage />
    </>
  );
};

export default Index;
