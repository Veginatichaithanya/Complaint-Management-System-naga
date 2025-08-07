
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from './AdminLayout';
import { DashboardTab } from './DashboardTab';
import { UsersTab } from './UsersTab';
import { AnalyticsTab } from './AnalyticsTab';
import { ChatbotTab } from './ChatbotTab';
import { SettingsTab } from './SettingsTab';
import { MeetingsTab } from './meetings/MeetingsTab';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');

  console.log('🎯 AdminPanel rendered with activeTab:', activeTab);
  console.log('📅 Render timestamp:', new Date().toISOString());

  const renderContent = () => {
    const content = (() => {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardTab />;
        case 'meetings':
          return <MeetingsTab />;
        case 'users':
          return <UsersTab />;
        case 'analytics':
          return <AnalyticsTab />;
        case 'chatbot':
          return <ChatbotTab />;
        case 'settings':
          return <SettingsTab />;
        default:
          return <DashboardTab />;
      }
    })();

    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full h-full"
      >
        {content}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="w-full max-w-none">
          {renderContent()}
        </div>
      </AdminLayout>
    </div>
  );
}
