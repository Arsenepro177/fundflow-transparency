import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Project {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funds_raised: number;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  amount_needed: number;
  status: string;
  proofs: Proof[];
}

interface Proof {
  id: string;
  proof_url: string;
  geotag?: string;
  created_at: string;
}

const NgoView: React.FC = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    funding_goal: ''
  });
  const [newMilestone, setNewMilestone] = useState({
    projectId: '',
    title: '',
    amount_needed: ''
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofGeotag, setProofGeotag] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          milestones (
            *,
            proofs (*)
          )
        `)
        .eq('ngo_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .insert([{
          ngo_id: profile.id,
          title: newProject.title,
          description: newProject.description,
          funding_goal: parseFloat(newProject.funding_goal)
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully"
      });

      setNewProject({ title: '', description: '', funding_goal: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const createMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const { error } = await supabase
        .from('milestones')
        .insert([{
          project_id: newMilestone.projectId,
          title: newMilestone.title,
          amount_needed: parseFloat(newMilestone.amount_needed)
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Milestone created successfully"
      });

      setNewMilestone({ projectId: '', title: '', amount_needed: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const uploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !selectedMilestone) return;

    setLoading(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${proofFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(fileName);

      // Create proof record
      const { error: proofError } = await supabase
        .from('proofs')
        .insert([{
          milestone_id: selectedMilestone,
          proof_url: publicUrl,
          geotag: proofGeotag || null
        }]);

      if (proofError) throw proofError;

      toast({
        title: "Success",
        description: "Proof uploaded successfully"
      });

      setProofFile(null);
      setProofGeotag('');
      setSelectedMilestone('');
      fetchProjects();
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast({
        title: "Error",
        description: "Failed to upload proof",
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="projects" className="w-full">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="create">Create Project</TabsTrigger>
          <TabsTrigger value="milestones">Manage Milestones</TabsTrigger>
          <TabsTrigger value="proofs">Submit Proofs</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Raised: {formatCurrency(project.funds_raised)}</span>
                        <span>Goal: {formatCurrency(project.funding_goal)}</span>
                      </div>
                      <Progress value={(project.funds_raised / project.funding_goal) * 100} />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Milestones ({project.milestones?.length || 0})</h4>
                      <div className="space-y-2">
                        {project.milestones?.map((milestone) => (
                          <div key={milestone.id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <span className="font-medium">{milestone.title}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {formatCurrency(milestone.amount_needed)}
                              </span>
                            </div>
                            <Badge variant={
                              milestone.status === 'COMPLETED' ? 'default' :
                              milestone.status === 'PENDING' ? 'secondary' : 'outline'
                            }>
                              {milestone.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Start a new fundraising campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="funding_goal">Funding Goal ($)</Label>
                  <Input
                    id="funding_goal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProject.funding_goal}
                    onChange={(e) => setNewProject({...newProject, funding_goal: e.target.value})}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Create Milestone</CardTitle>
              <CardDescription>Add milestones to track project progress</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createMilestone} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Select Project</Label>
                  <select
                    id="project"
                    className="w-full p-2 border rounded"
                    value={newMilestone.projectId}
                    onChange={(e) => setNewMilestone({...newMilestone, projectId: e.target.value})}
                    required
                  >
                    <option value="">Choose a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="milestone-title">Milestone Title</Label>
                  <Input
                    id="milestone-title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Needed ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newMilestone.amount_needed}
                    onChange={(e) => setNewMilestone({...newMilestone, amount_needed: e.target.value})}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Milestone'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proofs">
          <Card>
            <CardHeader>
              <CardTitle>Submit Proof</CardTitle>
              <CardDescription>Upload evidence for milestone completion</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={uploadProof} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="milestone">Select Milestone</Label>
                  <select
                    id="milestone"
                    className="w-full p-2 border rounded"
                    value={selectedMilestone}
                    onChange={(e) => setSelectedMilestone(e.target.value)}
                    required
                  >
                    <option value="">Choose a milestone</option>
                    {projects.flatMap(project => 
                      project.milestones?.map(milestone => (
                        <option key={milestone.id} value={milestone.id}>
                          {project.title} - {milestone.title}
                        </option>
                      )) || []
                    )}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proof-file">Proof File</Label>
                  <Input
                    id="proof-file"
                    type="file"
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="geotag">Geotag (Optional)</Label>
                  <Input
                    id="geotag"
                    placeholder="Latitude, Longitude"
                    value={proofGeotag}
                    onChange={(e) => setProofGeotag(e.target.value)}
                  />
                </div>
                
                <Button type="submit" disabled={loading || !proofFile}>
                  {loading ? 'Uploading...' : 'Submit Proof'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NgoView;