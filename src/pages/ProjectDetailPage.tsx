import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Eye } from 'lucide-react';

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funds_raised: number;
  created_at: string;
  profiles: {
    name: string;
  };
  milestones: Array<{
    id: string;
    title: string;
    amount_needed: number;
    status: string;
    proofs: Array<{
      id: string;
      proof_url: string;
      geotag?: string;
      created_at: string;
    }>;
    validations: Array<{
      id: number;
      is_valid: boolean;
    }>;
  }>;
}

interface LedgerEntry {
  id: number;
  event_type: string;
  details: any;
  timestamp: string;
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchLedger();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:ngo_id (
            name
          ),
          milestones (
            *,
            proofs (*),
            validations (
              id,
              is_valid
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .or(`details->>project_id.eq.${id},details->>milestone_id.in.(${project?.milestones.map(m => m.id).join(',') || ''})`)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setLedger(data || []);
    } catch (error) {
      console.error('Error fetching ledger:', error);
    }
  };

  const makeDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !id) return;

    const amount = parseFloat(donationAmount);
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid donation amount",
        variant: "destructive"
      });
      return;
    }

    setDonating(true);
    try {
      const { error } = await supabase.functions.invoke('make-donation', {
        body: { projectId: id, amount }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Donated $${amount.toFixed(2)} successfully!`
      });

      setDonationAmount('');
      fetchProject();
      fetchLedger();
    } catch (error) {
      console.error('Error making donation:', error);
      toast({
        title: "Error",
        description: "Failed to process donation",
        variant: "destructive"
      });
    }
    setDonating(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPositiveValidations = (milestone: ProjectDetail['milestones'][0]) => {
    return milestone.validations.filter(v => v.is_valid).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">FundChain</h1>
          </div>
          {user && (
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{project.title}</CardTitle>
                <CardDescription className="text-lg">
                  by {project.profiles?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            <Tabs defaultValue="milestones" className="w-full">
              <TabsList>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="ledger">Transaction Ledger</TabsTrigger>
              </TabsList>

              <TabsContent value="milestones" className="space-y-4">
                {project.milestones.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No milestones defined yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  project.milestones.map((milestone) => (
                    <Card key={milestone.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{milestone.title}</CardTitle>
                            <CardDescription>
                              {formatCurrency(milestone.amount_needed)} needed
                            </CardDescription>
                          </div>
                          <Badge variant={
                            milestone.status === 'COMPLETED' ? 'default' :
                            milestone.status === 'PENDING' ? 'secondary' : 'outline'
                          }>
                            {milestone.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Proofs */}
                          {milestone.proofs.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Proofs</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {milestone.proofs.map((proof) => (
                                  <div key={proof.id} className="border rounded p-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">
                                        Proof #{proof.id.slice(-6)}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(proof.proof_url, '_blank')}
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                    {proof.geotag && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Location: {proof.geotag}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Validations */}
                          <div>
                            <h4 className="font-semibold mb-2">
                              Validations ({getPositiveValidations(milestone)}/3 approved)
                            </h4>
                            <Progress 
                              value={(getPositiveValidations(milestone) / 3) * 100} 
                              className="w-full"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="ledger" className="space-y-4">
                {ledger.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No transactions recorded yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  ledger.map((entry) => (
                    <Card key={entry.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant={entry.event_type === 'donation' ? 'default' : 'secondary'}>
                              {entry.event_type.toUpperCase()}
                            </Badge>
                            <div className="mt-2 text-sm">
                              {entry.event_type === 'donation' ? (
                                <span>
                                  Donation of {formatCurrency(entry.details.amount)} received
                                </span>
                              ) : (
                                <span>
                                  Funds released for milestone completion
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Funding Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Raised</span>
                    <span>{formatCurrency(project.funds_raised)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Goal</span>
                    <span>{formatCurrency(project.funding_goal)}</span>
                  </div>
                  <Progress 
                    value={(project.funds_raised / project.funding_goal) * 100} 
                    className="w-full"
                  />
                  <div className="text-center mt-2 text-sm text-muted-foreground">
                    {Math.round((project.funds_raised / project.funding_goal) * 100)}% funded
                  </div>
                </div>

                <div className="text-center text-3xl font-bold text-primary">
                  {formatCurrency(project.funding_goal - project.funds_raised)}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  still needed
                </div>
              </CardContent>
            </Card>

            {/* Donation Form */}
            {user && profile?.role === 'donor' && (
              <Card>
                <CardHeader>
                  <CardTitle>Make a Donation</CardTitle>
                  <CardDescription>Support this project</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={makeDonation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="Enter amount"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={donating}>
                      {donating ? 'Processing...' : 'Donate Now'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {!user && (
              <Card>
                <CardHeader>
                  <CardTitle>Want to donate?</CardTitle>
                  <CardDescription>Sign up to support this project</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/auth">
                    <Button className="w-full">Sign Up to Donate</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Milestones</span>
                  <span className="text-sm">{project.milestones.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm">
                    {project.milestones.filter(m => m.status === 'COMPLETED').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailPage;