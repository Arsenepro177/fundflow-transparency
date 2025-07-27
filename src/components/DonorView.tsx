import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Heart, DollarSign, TrendingUp } from 'lucide-react';

interface Donation {
  id: number;
  amount: number;
  created_at: string;
  projects: {
    id: string;
    title: string;
    funding_goal: number;
    funds_raised: number;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funds_raised: number;
  profiles: {
    name: string;
  };
}

const DonorView: React.FC = () => {
  const { profile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [donationAmounts, setDonationAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDonations();
    fetchProjects();
  }, []);

  const fetchDonations = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          projects (
            id,
            title,
            funding_goal,
            funds_raised
          )
        `)
        .eq('donor_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch donations",
        variant: "destructive"
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:ngo_id (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const makeDonation = async (projectId: string) => {
    const amount = parseFloat(donationAmounts[projectId] || '0');
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid donation amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('make-donation', {
        body: { projectId, amount }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Donated $${amount.toFixed(2)} successfully!`
      });

      setDonationAmounts({ ...donationAmounts, [projectId]: '' });
      fetchDonations();
      fetchProjects();
    } catch (error) {
      console.error('Error making donation:', error);
      toast({
        title: "Error",
        description: "Failed to process donation",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTotalDonated = () => {
    return donations.reduce((total, donation) => total + donation.amount, 0);
  };

  const getUniqueProjectsSupported = () => {
    const uniqueProjects = new Set(donations.map(d => d.projects.id));
    return uniqueProjects.size;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(getTotalDonated())}</div>
                <div className="text-sm text-muted-foreground">Total Donated</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{getUniqueProjectsSupported()}</div>
                <div className="text-sm text-muted-foreground">Projects Supported</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{donations.length}</div>
                <div className="text-sm text-muted-foreground">Total Donations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Make a Donation</CardTitle>
          <CardDescription>Support projects that matter to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      by {project.profiles?.name}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <Link to={`/project/${project.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Raised: {formatCurrency(project.funds_raised)}</span>
                      <span>Goal: {formatCurrency(project.funding_goal)}</span>
                    </div>
                    <Progress 
                      value={(project.funds_raised / project.funding_goal) * 100} 
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Label htmlFor={`amount-${project.id}`} className="sr-only">
                        Donation amount
                      </Label>
                      <Input
                        id={`amount-${project.id}`}
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="Enter amount"
                        value={donationAmounts[project.id] || ''}
                        onChange={(e) => setDonationAmounts({
                          ...donationAmounts,
                          [project.id]: e.target.value
                        })}
                      />
                    </div>
                    <Button
                      onClick={() => makeDonation(project.id)}
                      disabled={loading || !donationAmounts[project.id]}
                    >
                      {loading ? 'Processing...' : 'Donate'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects available for donation</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Donation History</CardTitle>
          <CardDescription>Track your impact over time</CardDescription>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No donations yet. Start supporting projects above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">{donation.projects.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">
                      {formatCurrency(donation.amount)}
                    </div>
                    <Link 
                      to={`/project/${donation.projects.id}`}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DonorView;