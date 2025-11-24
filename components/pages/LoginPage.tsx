
import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { auth, GoogleAuthProvider, signInWithPopup } from '../../firebase';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.23 0 5.45.98 7.02 2.4l5.42-5.42C32.75 3.33 28.84 2 24 2 14.5 2 6.53 7.82 3.86 16.5l6.52 4.99C11.87 14.45 17.42 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.14 24.5c0-1.54-.14-3.05-.4-4.5H24v8.5h12.44c-.55 3.03-2.13 5.58-4.6 7.28l6.4 4.94C42.84 36.3 46.14 31.02 46.14 24.5z"></path>
        <path fill="#FBBC05" d="M10.38 21.49C9.88 19.96 9.5 18.25 9.5 16.5s.38-3.46.88-4.99L3.86 6.51C1.3 11.23 0 16.32 0 21.5s1.3 10.27 3.86 14.99l6.52-4.99z"></path>
        <path fill="#EA4335" d="M24 46c5.96 0 10.99-1.95 14.65-5.28l-6.4-4.94c-1.98 1.33-4.5 2.12-7.25 2.12-6.58 0-12.13-4.95-13.64-11.49L3.86 31.49C6.53 40.18 14.5 46 24 46z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener in AppContext will handle navigation
    } catch (error) {
      console.error("Firebase sign-in error:", error);
      setError("Failed to sign in. Please try again.");
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2 text-text-primary">Welcome to AI Interview Prep</h1>
        <p className="text-text-secondary mb-8">Your personal coach to ace your next interview.</p>
        <Button onClick={handleSignIn} size="lg" className="w-full" isLoading={isLoading}>
            <GoogleIcon />
            Sign in with Google
        </Button>
        {error && <p className="text-xs text-red-400 mt-4">{error}</p>}
      </Card>
    </div>
  );
};

export default LoginPage;