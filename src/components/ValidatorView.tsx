import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validation Dashboard</CardTitle>
          <CardDescription>
            Review and validate milestone submissions from NGOs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{milestones.length}</div>
              <div className="text-sm text-muted-foreground">Pending Milestones</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {milestones.filter(m => hasUserVoted(m)).length}
              </div>
              <div className="text-sm text-muted-foreground">Your Votes</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {milestones.filter(m => getPositiveVotes(m) >= 3).length}
              </div>
              <div className="text-sm text-muted-foreground">Ready for Approval</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Pending Validations</h3>
        
        {milestones.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No pending milestones to validate</p>
            </CardContent>
          </Card>
        ) : (
          milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                    <CardDescription>
                      {milestone.projects.title} by {milestone.projects.profiles?.name}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(milestone.amount_needed)}
                    </div>
                    <Badge variant="secondary">
                      {getPositiveVotes(milestone)}/3 approvals
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Proofs Section */}
                  <div>
                    <h4 className="font-semibold mb-2">
                      Submitted Proofs ({milestone.proofs.length})
                    </h4>
                    {milestone.proofs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No proofs submitted yet</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {milestone.proofs.map((proof) => (
                          <div key={proof.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Proof #{proof.id.slice(-6)}</span>
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
                              <p className="text-xs text-muted-foreground">
                                Location: {proof.geotag}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Submitted: {new Date(proof.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Voting Section */}
                  <div className="border-t pt-4">
                    {hasUserVoted(milestone) ? (
                      <div className="text-center">
                        <Badge variant="outline">You have already voted on this milestone</Badge>
                      </div>
                    ) : (
                      <div className="flex justify-center space-x-4">
                        <Button
                          onClick={() => castVote(milestone.id, false)}
                          variant="destructive"
                          disabled={votingLoading === milestone.id || milestone.proofs.length === 0}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => castVote(milestone.id, true)}
                          disabled={votingLoading === milestone.id || milestone.proofs.length === 0}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Validation History */}
                  {milestone.validations.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Validation History</h4>
                      <div className="space-y-1">
                        {milestone.validations.map((validation) => (
                          <div key={validation.id} className="flex items-center space-x-2 text-sm">
                            {validation.is_valid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>
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
          ))
        )}
      </div>
    </div>
  );
};

export default ValidatorView;