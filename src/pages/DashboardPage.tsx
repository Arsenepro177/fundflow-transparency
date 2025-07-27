import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import NgoView from '@/components/NgoView';
import ValidatorView from '@/components/ValidatorView';
import DonorView from '@/components/DonorView';
import { 
  Heart, 
  LogOut, 
  Settings, 
  Bell,
  Home,
  User,
  Building,
  UserCheck,
  DollarSign
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderRoleView = () => {
    switch (profile?.role) {
      case 'ngo':
        return <NgoView />;
      case 'validator':
        return <ValidatorView />;
      case 'donor':
        return <DonorView />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>Loading your dashboard...</CardDescription>
            </CardHeader>
          </Card>
        );
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'donor':
        return <DollarSign className="w-4 h-4" />;
      case 'ngo':
        return <Building className="w-4 h-4" />;
      case 'validator':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'donor':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'ngo':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'validator':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                FundFlow
              </h1>
            </Link>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold">
                    {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium">
                    {profile?.name || user?.email}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getRoleColor(profile?.role || '')} border-0`}
                    >
                      {getRoleIcon(profile?.role || '')}
                      <span className="ml-1 capitalize">{profile?.role}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Settings & Sign Out */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, <span className="text-gradient">{profile?.name?.split(' ')[0] || 'User'}</span>
              </h1>
              <p className="text-lg text-muted-foreground flex items-center">
                <span>Manage your {profile?.role} activities</span>
                <Badge 
                  variant="outline" 
                  className={`ml-3 ${getRoleColor(profile?.role || '')}`}
                >
                  {getRoleIcon(profile?.role || '')}
                  <span className="ml-1 capitalize">{profile?.role} Dashboard</span>
                </Badge>
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" className="hover-lift">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Role-specific Content */}
        <div className="animate-slide-up">
          {renderRoleView()}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;