import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import MeetooLogo from '@/components/shared/MeetooLogo';
import Landing from './pages/Landing';
import Discover from './pages/Discover';
import UserProfile from './pages/UserProfile';
import Requests from './pages/Requests';
import Conversations from './pages/Conversations';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import AppLayout from './components/shared/AppLayout';

const LoginRequired = () => {
  const { navigateToLogin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <MeetooLogo size="md" />
      <h1 className="mt-8 text-2xl font-serif font-bold">Entre para continuar</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Use seu email para receber um link de acesso seguro.
      </p>
      <Button onClick={navigateToLogin} className="mt-8 rounded-full px-8">
        Receber link de acesso
      </Button>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRequired />} />}>
        <Route element={<AppLayout />}>
          <Route path="/discover" element={<Discover />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={routerBasename}>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
