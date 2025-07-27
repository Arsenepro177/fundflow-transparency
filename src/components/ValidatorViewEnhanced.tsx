import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, Shield, MapPin } from 'lucide-react';

interface MilestoneWithDetails {
  id: string;
  title: string;
  amount_needed: number;
  status: string;
  projects: {
    title: string;
    profiles: {
      name: string;
    };
  };
  proofs: Array<{
    id: string;
    proof_url: string;
    geotag?: string;
    created_at: string;
  }>;
  validations: Array<{
    id: number;
    is_valid: boolean;
    validator_id: string;
  }>;
}

const ValidatorView: React.FC = () => {
  const { profile } = useAuth();
  const [milestones, setMilestones] = useState<MilestoneWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingMilestones();
  }, []);

  const fetchPendingMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select(`
          *,
          projects (
            title,
            profiles:ngo_id (
              name
            )
          ),
          proofs (*),
          validations (
            id,
            is_valid,
            validator_id
          )
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast({
        title: "Error",
        description: "Failed to fetch milestones",
        variant: "destructive"
      });
    }
  };

  const castVote = async (milestoneId: string, isValid: boolean) => {
    if (!profile?.id) return;

    setVotingLoading(milestoneId);
    try {
      const { error } = await supabase.functions.invoke('cast-vote', {
        body: { milestoneId, isValid }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vote ${isValid ? 'approved' : 'rejected'} successfully`
      });

      fetchPendingMilestones();
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: "Error",
        description: "Failed to cast vote",
        variant: "destructive"
      });
    }
    setVotingLoading(null);
  };

  const hasUserVoted = (milestone: MilestoneWithDetails) => {
    return milestone.validations.some(v => v.validator_id === profile?.id);
  };

  const getPositiveVotes = (milestone: MilestoneWithDetails) => {
    return milestone.validations.filter(v => v.is_valid).length;
  };

  const getNegativeVotes = (milestone: MilestoneWithDetails) => {
    return milestone.validations.filter(v => !v.is_valid).length;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center animate-fade-in mb-8">
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full shadow-md">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span className="text-lg font-semibold">Validator Dashboard</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">{milestones.length}</div>
                <div className="text-sm font-medium text-muted-foreground">Pending Milestones</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full inline-block">
              📋 Awaiting Review
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {milestones.filter(m => hasUserVoted(m)).length}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Your Votes</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded-full inline-block">
              🗳️ Voted
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {milestones.filter(m => getPositiveVotes(m) >= 3).length}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Ready for Approval</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full inline-block">
              ✅ Approved
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {milestones.reduce((acc, m) => acc + m.proofs.length, 0)}
                </div>
                <div className="text-sm font-medium text-muted-foreground">Total Proofs</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full inline-block">
              📁 Evidence
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Validations */}
      <div className="space-y-6 animate-fade-in" style={{animationDelay: '0.4s'}}>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Pending Validations</h2>
          <Badge variant="outline" className="px-3 py-1">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} pending
          </Badge>
        </div>
        
        {milestones.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <Shield className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">No Pending Validations</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Great job! There are currently no milestones awaiting your validation. Check back later for new submissions.
              </p>
              <Button variant="outline" size="lg">
                <Eye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <Card 
                key={milestone.id} 
                className="group border-0 shadow-lg hover-lift bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 animate-slide-up overflow-hidden"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold">
                          {milestone.projects.profiles?.name?.charAt(0) || 'N'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                          {milestone.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          <span className="font-medium">{milestone.projects.title}</span> by {milestone.projects.profiles?.name}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(milestone.amount_needed)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          {getPositiveVotes(milestone)}/3
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <XCircle className="w-3 h-3 mr-1 text-red-500" />
                          {getNegativeVotes(milestone)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* Proofs Section */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center">
                        <Eye className="w-4 h-4 mr-2 text-primary" />
                        Submitted Proofs ({milestone.proofs.length})
                      </h4>
                      {milestone.proofs.length === 0 ? (
                        <div className="text-center py-8 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">No proofs submitted yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {milestone.proofs.map((proof) => (
                            <div key={proof.id} className="border rounded-xl p-4 bg-gradient-to-r from-background to-muted/20 hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">Proof #{proof.id.slice(-6)}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(proof.proof_url, '_blank')}
                                  className="hover-lift"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                              {proof.geotag && (
                                <div className="flex items-center text-xs text-muted-foreground mb-2">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>Location: {proof.geotag}</span>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Submitted: {new Date(proof.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Voting Section */}
                    <div className="border-t pt-6">
                      {hasUserVoted(milestone) ? (
                        <div className="text-center py-4">
                          <Badge variant="outline" className="px-4 py-2 text-sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            You have already voted on this milestone
                          </Badge>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-center">Cast Your Vote</h4>
                          <div className="flex justify-center space-x-4">
                            <Button
                              onClick={() => castVote(milestone.id, false)}
                              variant="destructive"
                              size="lg"
                              disabled={votingLoading === milestone.id || milestone.proofs.length === 0}
                              className="px-8 hover-lift"
                            >
                              {votingLoading === milestone.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button>
                            <Button
                              onClick={() => castVote(milestone.id, true)}
                              size="lg"
                              disabled={votingLoading === milestone.id || milestone.proofs.length === 0}
                              className="gradient-bg text-white hover:opacity-90 px-8 hover-lift"
                            >
                              {votingLoading === milestone.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Approve
                            </Button>
                          </div>
                          {milestone.proofs.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground">
                              Voting is disabled until proofs are submitted
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Validation History */}
                    {milestone.validations.length > 0 && (
                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-primary" />
                          Validation History
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {milestone.validations.map((validation) => (
                            <div 
                              key={validation.id} 
                              className={`flex items-center space-x-3 p-3 rounded-lg ${
                                validation.is_valid 
                                  ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                                  : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                              }`}
                            >
                              {validation.is_valid ? (
                                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                              )}
                              <span className={`text-sm font-medium ${
                                validation.is_valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                              }`}>
                                Validator voted {validation.is_valid ? 'approve' : 'reject'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidatorView;
