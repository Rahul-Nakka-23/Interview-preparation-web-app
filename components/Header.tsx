
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Header: React.FC = () => {
  const { setPage, page, user, roadmap, startNewInterview } = useContext(AppContext);

  return (
    <header className="bg-secondary shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-accent">AI Interview Prep</h1>
            {user && (
              <div className="hidden md:block ml-10">
                <span className="text-text-secondary">Welcome, {user.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPage('resume-checker')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${page === 'resume-checker' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-gray-700 hover:text-white'}`}
            >
              Resume Checker
            </button>
            {page !== 'interview' && roadmap.length > 0 && (
              <button
                onClick={() => setPage('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${page === 'dashboard' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-gray-700 hover:text-white'}`}
              >
                Dashboard
              </button>
            )}
            {page !== 'setup' && (
               <button
                onClick={startNewInterview}
                className="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-gray-700 hover:text-white"
              >
                New Interview
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;