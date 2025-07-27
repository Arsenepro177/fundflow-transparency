import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Heart, 
  Shield, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
  ChevronRight,
  Eye,
  DollarSign,
  MapPin
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  funding_goal: number;
  funds_raised: number;
  created_at: string;
  profiles: {
    name: string;
  };
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full w-48 mx-auto shimmer"></div>
            <div className="h-2 bg-muted rounded-full w-32 mx-auto shimmer"></div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              FundFlow
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a href="#features" className="transition-colors hover:text-primary">Features</a>
            <a href="#projects" className="transition-colors hover:text-primary">Projects</a>
            <a href="#about" className="transition-colors hover:text-primary">About</a>
          </nav>
          <div className="flex items-center space-x-2">
            {user ? (
              <Link to="/dashboard">
                <Button className="gradient-bg text-white hover:opacity-90 transition-opacity">
                  <Users className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="hover:bg-muted">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="gradient-bg text-white hover:opacity-90 transition-opacity">
                    Get Started
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/5 to-green-600/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              Transparent • Verified • Impactful
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-balance">
              <span className="text-gradient">Transparent</span>{' '}
              <span className="text-foreground">NGO Funding</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Track every donation, validate milestones, and ensure your contributions make a real impact with blockchain-powered transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-bg text-white hover:opacity-90 transition-all hover-lift px-8 py-6 text-lg">
                  <Heart className="w-5 h-5 mr-2" />
                  Start Donating
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg hover-lift">
                <Eye className="w-5 h-5 mr-2" />
                Explore Projects
              </Button>
            </div>
          </div>
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg">100% Transparent</h3>
              <p className="text-muted-foreground text-sm">Every donation is tracked and verified on the blockchain</p>
            </div>
            <div className="text-center space-y-2 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Impact Driven</h3>
              <p className="text-muted-foreground text-sm">See real-time progress and proof of impact</p>
            </div>
            <div className="text-center space-y-2 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Global Reach</h3>
              <p className="text-muted-foreground text-sm">Support vetted NGOs making a difference worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4 px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Live Projects
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Make an Impact <span className="text-gradient">Today</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Support transparent initiatives that are changing lives around the world
            </p>
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">No Projects Yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Be among the first to know when amazing projects launch. Check back soon!
              </p>
              <Button variant="outline" size="lg">
                <Eye className="w-4 h-4 mr-2" />
                Subscribe for Updates
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => {
                const progressPercentage = (project.funds_raised / project.funding_goal) * 100;
                return (
                  <Card 
                    key={project.id} 
                    className="group hover-lift card-glow border-0 shadow-lg bg-card/50 backdrop-blur-sm animate-fade-in overflow-hidden"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500"></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold">
                              {project.profiles?.name?.charAt(0) || 'N'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{project.profiles?.name || 'Unknown NGO'}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              Global Initiative
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={progressPercentage >= 100 ? "default" : "secondary"}
                          className="shrink-0"
                        >
                          {progressPercentage >= 100 ? 'Funded' : 'Active'}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center text-green-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span className="font-semibold">{formatCurrency(project.funds_raised)}</span>
                          </div>
                          <span className="text-muted-foreground">
                            of {formatCurrency(project.funding_goal)} goal
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Progress 
                            value={progressPercentage} 
                            className="w-full h-3 bg-muted"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{Math.round(progressPercentage)}% funded</span>
                            <span>#{project.id.slice(-6)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Link to={`/project/${project.id}`}>
                        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <Eye className="w-4 h-4 mr-2" />
                          View Project
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Why Choose FundFlow
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Built for <span className="text-gradient">Trust</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform ensures every donation creates maximum impact through transparency and accountability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center space-y-4 animate-slide-up hover-lift" style={{animationDelay: '0.1s'}}>
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Blockchain Verified</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every transaction is recorded on the blockchain, ensuring complete transparency and immutability of your donations.
              </p>
            </div>
            
            <div className="text-center space-y-4 animate-slide-up hover-lift" style={{animationDelay: '0.2s'}}>
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor your donations in real-time and see exactly how your contributions are being used to create impact.
              </p>
            </div>
            
            <div className="text-center space-y-4 animate-slide-up hover-lift" style={{animationDelay: '0.3s'}}>
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Verified NGOs</h3>
              <p className="text-muted-foreground leading-relaxed">
                All NGOs are thoroughly vetted and verified before joining our platform, ensuring your trust is well-placed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Join thousands of donors who are creating transparent, impactful change around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90 px-8 py-6 text-lg font-semibold hover-lift">
                  <Heart className="w-5 h-5 mr-2" />
                  Start Your Journey
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg hover-lift"
              >
                <Eye className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  FundFlow
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Transparent funding for a better world. Every donation tracked, every impact verified.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">For NGOs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">For Donors</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Verification</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 FundFlow Transparency. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Blockchain Secured
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Award className="w-3 h-3 mr-1" />
                Verified Platform
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;