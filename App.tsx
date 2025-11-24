
import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';
import SetupPage from './components/pages/SetupPage';
import InterviewPage from './components/pages/InterviewPage';
import ResultsPage from './components/pages/ResultsPage';
import DashboardPage from './components/pages/DashboardPage';
import ResumeCheckerPage from './components/pages/ResumeCheckerPage';
import Header from './components/Header';

const App: React.FC = () => {
  const { page } = useContext(AppContext);

  const renderPage = () => {
    switch (page) {
      case 'setup':
        return <SetupPage />;
      case 'interview':
        return <InterviewPage />;
      case 'results':
        return <ResultsPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'resume-checker':
        return <ResumeCheckerPage />;
      default:
        return <SetupPage />;
    }
  };

  return (
    <div className="min-h-screen bg-primary font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;