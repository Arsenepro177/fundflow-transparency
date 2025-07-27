import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import NgoView from '@/components/NgoView';
import ValidatorView from '@/components/ValidatorView';
import DonorView from '@/components/DonorView';

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary">FundChain</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.name || user?.email}
            </span>
            <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize">
              {profile?.role}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your {profile?.role} activities
          </p>
        </div>

        {renderRoleView()}
      </main>
    </div>
  );
};

export default DashboardPage;