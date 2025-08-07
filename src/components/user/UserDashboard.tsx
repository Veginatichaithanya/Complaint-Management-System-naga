
import React, { useState } from 'react';
import { UserSidebar } from './UserSidebar';
import { DashboardHome } from './pages/DashboardHome';
import { RaiseComplaint } from './pages/RaiseComplaint';
import { SyncedMyComplaints } from './pages/SyncedMyComplaints';
import { ChatbotPage } from './pages/ChatbotPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminMeetingsPage } from './pages/AdminMeetingsPage';
import { UserNavbar } from './UserNavbar';

type PageType = 'home' | 'raise-complaint' | 'my-complaints' | 'chatbot' | 'notifications' | 'profile' | 'admin-meetings';

export function UserDashboard() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRaiseComplaint = () => {
    setCurrentPage('raise-complaint');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardHome onRaiseComplaint={handleRaiseComplaint} />;
      case 'raise-complaint':
        return <RaiseComplaint />;
      case 'my-complaints':
        return <SyncedMyComplaints />;
      case 'chatbot':
        return <ChatbotPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin-meetings':
        return <AdminMeetingsPage />;
      default:
        return <DashboardHome onRaiseComplaint={handleRaiseComplaint} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UserSidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-64">
        <UserNavbar 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          currentPage={currentPage}
        />
        <main className="min-h-screen">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}
