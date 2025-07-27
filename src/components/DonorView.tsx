import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Heart, DollarSign, TrendingUp, Eye } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(getTotalDonated())}</div>
                <div className="text-sm text-muted-foreground font-medium">Total Donated</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full inline-block">
              💚 Making Impact
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-pink-600 mb-1">{getUniqueProjectsSupported()}</div>
                <div className="text-sm text-muted-foreground font-medium">Projects Supported</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-pink-600 bg-pink-100 dark:bg-pink-900/20 px-2 py-1 rounded-full inline-block">
              ❤️ Lives Changed
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-1">{donations.length}</div>
                <div className="text-sm text-muted-foreground font-medium">Total Donations</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full inline-block">
              📈 Growing Impact
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Projects */}
      <Card className="border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.3s'}}>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Heart className="w-6 h-6 mr-2 text-primary" />
                Make a Donation
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Support transparent projects that are changing lives around the world
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {projects.map((project, index) => {
              const progressPercentage = (project.funds_raised / project.funding_goal) * 100;
              return (
                <div key={project.id} className="group border border-muted rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-primary/30 bg-gradient-to-r from-background to-muted/20">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {project.profiles?.name?.charAt(0) || 'N'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{project.title}</h3>
                          <p className="text-sm font-medium text-muted-foreground">
                            by {project.profiles?.name}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    <Link to={`/project/${project.id}`}>
                      <Button variant="outline" size="sm" className="hover-lift">
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-green-600">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          {formatCurrency(project.funds_raised)} raised
                        </span>
                        <span className="text-muted-foreground">
                          Goal: {formatCurrency(project.funding_goal)}
                        </span>
                      </div>
                      <Progress 
                        value={progressPercentage} 
                        className="w-full h-3 bg-muted"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{Math.round(progressPercentage)}% funded</span>
                        <span>#{project.id.slice(-6)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <div className="flex-1">
                        <Label htmlFor={`amount-${project.id}`} className="text-sm font-medium mb-2 block">
                          Donation Amount
                        </Label>
                        <Input
                          id={`amount-${project.id}`}
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="$10.00"
                          value={donationAmounts[project.id] || ''}
                          onChange={(e) => setDonationAmounts({
                            ...donationAmounts,
                            [project.id]: e.target.value
                          })}
                          className="h-12 text-lg font-semibold"
                        />
                      </div>
                      <Button
                        onClick={() => makeDonation(project.id)}
                        disabled={loading || !donationAmounts[project.id]}
                        size="lg"
                        className="gradient-bg text-white hover:opacity-90 transition-all h-12 px-8 font-semibold"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-2" />
                            Donate
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">No Projects Available</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                There are currently no projects available for donation. Check back soon for new opportunities to make an impact!
              </p>
              <Button variant="outline" size="lg">
                <Eye className="w-4 h-4 mr-2" />
                Browse All Projects
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation History */}
      <Card className="border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-primary" />
                Your Donation History
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Track your impact journey and see the difference you've made
              </CardDescription>
            </div>
            {donations.length > 0 && (
              <Badge variant="outline" className="px-3 py-1">
                {donations.length} donation{donations.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">No Donations Yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Start supporting projects above to see your donation history and track your impact!
              </p>
              <Button variant="outline" size="lg">
                <Heart className="w-4 h-4 mr-2" />
                Make Your First Donation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation, index) => (
                <div 
                  key={donation.id} 
                  className="group flex justify-between items-center p-6 border border-muted hover:border-primary/30 rounded-xl transition-all duration-300 hover:shadow-md bg-gradient-to-r from-background to-muted/10"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {donation.projects.title}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <span>{new Date(donation.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                        <span className="mx-2">•</span>
                        <span>#{donation.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-4">
                    <div>
                      <div className="font-bold text-xl text-green-600">
                        {formatCurrency(donation.amount)}
                      </div>
                      <Link 
                        to={`/project/${donation.projects.id}`}
                        className="text-sm text-primary hover:underline font-medium flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Project
                      </Link>
                    </div>
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