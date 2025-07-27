import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart,
  Clipboard,
  Upload,
  CheckCircle,
  Award,
  Layers,
  Plus,
  FileText,
  Building
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funds_raised: number;
  milestones: Milestone[];
  profiles?: {
    name: string;
  };
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-md">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span className="text-lg font-semibold">NGO Dashboard</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-auto">
          <TabsTrigger 
            value="projects" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white flex items-center gap-2 py-3"
          >
            <Layers className="w-4 h-4" />
            <span>My Projects</span>
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white flex items-center gap-2 py-3"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </TabsTrigger>
          <TabsTrigger 
            value="milestones" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white flex items-center gap-2 py-3"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Manage Milestones</span>
          </TabsTrigger>
          <TabsTrigger 
            value="proofs" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white flex items-center gap-2 py-3"
          >
            <Upload className="w-4 h-4" />
            <span>Submit Proofs</span>
          </TabsTrigger>
        </TabsList>

        {/* My Projects Tab */}
        <TabsContent value="projects" className="space-y-6 animate-fade-in">
          {projects.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                  <Layers className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4">No Projects Yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Create your first project to start raising funds for your cause and making a difference in the world.
                </p>
                <Button className="gradient-bg text-white hover:opacity-90 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {projects.map((project, index) => {
                const progressPercentage = (project.funds_raised / project.funding_goal) * 100;
                return (
                  <Card 
                    key={project.id} 
                    className="group border-0 shadow-lg hover-lift bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 animate-slide-up"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                              {project.title.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                              {project.title}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                              {project.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={progressPercentage >= 100 ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {progressPercentage >= 100 ? 'Funded' : 'Active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-green-600 flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            Raised: {formatCurrency(project.funds_raised)}
                          </span>
                          <span className="text-muted-foreground">
                            Goal: {formatCurrency(project.funding_goal)}
                          </span>
                        </div>
                        <Progress 
                          value={progressPercentage} 
                          className="w-full h-3 bg-muted"
                        />
                        <div className="text-xs text-muted-foreground text-center">
                          {progressPercentage >= 100 
                            ? '🎉 Congratulations! Project Fully Funded' 
                            : `${progressPercentage.toFixed(0)}% funded`
                          }
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                            Milestones ({project.milestones?.length || 0})
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {project.milestones?.map((milestone) => (
                            <div key={milestone.id} className="flex justify-between items-center p-4 border-l-4 border-primary/30 rounded-r-lg bg-gradient-to-r from-muted/30 to-transparent">
                              <div>
                                <p className="font-semibold">{milestone.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Needed: {formatCurrency(milestone.amount_needed)}
                                </p>
                              </div>
                              <Badge 
                                variant={
                                  milestone.status === 'COMPLETED' ? 'default' : 
                                  milestone.status === 'PENDING' ? 'secondary' : 'outline'
                                }
                                className="capitalize"
                              >
                                {milestone.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Create Project Tab */}
        <TabsContent value="create" className="animate-fade-in">
          <Card className="border-0 shadow-lg animate-scale-in">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center">
                <FileText className="w-6 h-6 mr-2 text-primary" />
                Create New Project
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Start a new fundraising campaign and make a difference in the world
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProject} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Project Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Clean Water Initiative"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    className="h-12 px-4 bg-background/50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Project Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of your project goals, objectives, and expected impact..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="min-h-[120px] bg-background/50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="funding_goal" className="text-sm font-medium">
                    Funding Goal ($)
                  </Label>
                  <Input
                    id="funding_goal"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 10000.00"
                    value={newProject.funding_goal}
                    onChange={(e) => setNewProject({...newProject, funding_goal: e.target.value})}
                    className="h-12 px-4 bg-background/50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-bg text-white hover:opacity-90 transition-all font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Creating Project...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Milestones Tab */}
        <TabsContent value="milestones" className="animate-fade-in">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-primary" />
                Create Milestone
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Add milestones to track project progress and build donor confidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createMilestone} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-medium">
                    Select Project
                  </Label>
                  <select
                    id="project"
                    className="w-full h-12 p-4 border rounded-lg bg-background/50 focus:bg-white transition-colors"
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
                  <Label htmlFor="milestone-title" className="text-sm font-medium">
                    Milestone Title
                  </Label>
                  <Input
                    id="milestone-title"
                    placeholder="e.g. Phase 1: Site Preparation"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                    className="h-12 px-4 bg-background/50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Amount Needed ($)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 2500.00"
                    value={newMilestone.amount_needed}
                    onChange={(e) => setNewMilestone({...newMilestone, amount_needed: e.target.value})}
                    className="h-12 px-4 bg-background/50 focus:bg-white transition-colors"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-bg text-white hover:opacity-90 transition-all font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Creating Milestone...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Milestone
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submit Proofs Tab */}
        <TabsContent value="proofs" className="animate-fade-in">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl flex items-center">
                <Upload className="w-6 h-6 mr-2 text-primary" />
                Submit Proof
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Upload evidence for milestone completion to maintain transparency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={uploadProof} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="milestone" className="text-sm font-medium">
                    Select Milestone
                  </Label>
                  <select
                    id="milestone"
                    className="w-full h-12 p-4 border rounded-lg bg-background/50 focus:bg-white transition-colors"
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
                  <Label htmlFor="proof-file" className="text-sm font-medium">
                    Proof File
                  </Label>
                  <Input
                    id="proof-file"
                    type="file"
                    accept="image/*,video/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="h-12 px-4 bg-background/50 focus:bg-white transition-colors"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: Images, Videos, PDF documents
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="geotag" className="text-sm font-medium">
                    Geotag (Optional)
                  </Label>
                  <Input
                    id="geotag"
                    placeholder="Latitude, Longitude (e.g. 40.7128, -74.0060)"
                    value={proofGeotag}
                    onChange={(e) => setProofGeotag(e.target.value)}
                    className="h-12 px-4 bg-background/50 focus:bg-white transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add location data to provide additional verification
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-bg text-white hover:opacity-90 transition-all font-semibold"
                  disabled={loading || !proofFile}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Uploading Proof...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Proof
                    </div>
                  )}
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
