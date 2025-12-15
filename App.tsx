import React, { useState, useEffect } from 'react';
import { AppView, User } from './types';
import Navigation from './components/Navigation';
import CarbonTracker from './components/CarbonTracker';
import RecycleAssistant from './components/RecycleAssistant';
import GreenTips from './components/GreenTips';
import EcoQuiz from './components/EcoQuiz';
import HabitGrowth from './components/HabitGrowth';
import CommunityHub from './components/CommunityHub';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { LeafIcon } from './components/Icons';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.GROWTH);

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('eco_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('eco_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('eco_user');
    setUser(null);
    setCurrentView(AppView.GROWTH);
  };

  const renderContent = () => {
    // If not logged in, just safe guard (though we handle this at root return)
    if (!user) return null;

    switch (currentView) {
      case AppView.TRACKER:
        return <CarbonTracker />;
      case AppView.RECYCLE:
        return <RecycleAssistant />;
      case AppView.GROWTH:
        return <HabitGrowth user={user} />;
      case AppView.COMMUNITY:
        return <CommunityHub user={user} />;
      case AppView.ADVICE:
        return <GreenTips />;
      case AppView.QUIZ:
        return <EcoQuiz />;
      case AppView.PROFILE:
        return <Profile user={user} onLogout={handleLogout} />;
      default:
        return <HabitGrowth user={user} />;
    }
  };

  // Auth Flow
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // Main App Flow
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#f2fcf5] text-gray-800 font-sans">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <div className="md:w-64 md:border-r md:border-leaf-200 bg-gradient-to-b from-[#f2fcf5] to-[#e1f8e8] hidden md:block">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white/80 backdrop-blur-md border-b border-leaf-100 flex items-center justify-center sticky top-0 z-40">
           <div className="flex items-center gap-2 text-leaf-700">
             <LeafIcon className="w-6 h-6" />
             <h1 className="text-lg font-bold tracking-tight">绿色生活</h1>
           </div>
           {/* Quick Quiz Access Button for Mobile Header */}
           {currentView !== AppView.QUIZ && (
             <button 
               onClick={() => setCurrentView(AppView.QUIZ)}
               className="absolute right-4 text-xs font-bold bg-leaf-100 text-leaf-700 px-3 py-1.5 rounded-full"
             >
               挑战
             </button>
           )}
        </header>

        {/* Dynamic View Container */}
        <div className="flex-1 overflow-hidden p-4 md:p-8 max-w-5xl mx-auto w-full">
           <div className="h-full w-full fade-in-enter">
              {renderContent()}
           </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
           <Navigation currentView={currentView} onViewChange={setCurrentView} />
        </div>
      </main>
    </div>
  );
};

export default App;