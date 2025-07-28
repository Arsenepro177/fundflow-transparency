import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Heart, 
  Shield, 
  Eye, 
  User, 
  Mail, 
  Lock, 
  ArrowLeft,
  Building,
  UserCheck,
  DollarSign
} from 'lucide-react';

const AuthPage: React.FC = () => {
  const { user, signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form states
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'donor' as 'ngo' | 'donor' | 'validator'
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(signInForm.email, signInForm.password);
    
    setLoading(false);
    
    if (!error) {
      // Will be redirected by auth state change
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(
      signUpForm.email, 
      signUpForm.password, 
      signUpForm.name, 
      signUpForm.role
    );
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-green-950/20">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </div>
      
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              FundFlow
            </h1>
            <p className="text-muted-foreground">
              Join the transparent funding revolution
            </p>
          </div>
          
          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm animate-scale-in">
            <CardContent className="p-8">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
            
            <TabsContent value="signin" className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-semibold">Welcome Back</h2>
                <p className="text-sm text-muted-foreground">
                  Continue your impact journey
                </p>
              </div>
              
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({...signInForm, email: e.target.value})}
                    className="h-12 px-4 bg-background/50 border-muted focus:border-primary transition-colors"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({...signInForm, password: e.target.value})}
                    className="h-12 px-4 bg-background/50 border-muted focus:border-primary transition-colors"
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-bg text-white hover:opacity-90 transition-all font-semibold" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Sign In
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-semibold">Join FundFlow</h2>
                <p className="text-sm text-muted-foreground">
                  Start making transparent impact today
                </p>
              </div>
              
              {/* Role Selection Cards */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setSignUpForm({...signUpForm, role: 'donor'})}
                  className={`p-3 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                    signUpForm.role === 'donor' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <DollarSign className="w-6 h-6 mx-auto mb-1 text-primary" />
                  <span className="text-xs font-medium">Donor</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSignUpForm({...signUpForm, role: 'ngo'})}
                  className={`p-3 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                    signUpForm.role === 'ngo' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <Building className="w-6 h-6 mx-auto mb-1 text-primary" />
                  <span className="text-xs font-medium">NGO</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSignUpForm({...signUpForm, role: 'validator'})}
                  className={`p-3 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                    signUpForm.role === 'validator' 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <UserCheck className="w-6 h-6 mx-auto mb-1 text-primary" />
                  <span className="text-xs font-medium">Validator</span>
                </button>
              </div>
              
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpForm.name}
                    onChange={(e) => setSignUpForm({...signUpForm, name: e.target.value})}
                    className="h-12 px-4 bg-background/50 border-muted focus:border-primary transition-colors"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm({...signUpForm, email: e.target.value})}
                    className="h-12 px-4 bg-background/50 border-muted focus:border-primary transition-colors"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm({...signUpForm, password: e.target.value})}
                    className="h-12 px-4 bg-background/50 border-muted focus:border-primary transition-colors"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use 8+ characters with a mix of letters, numbers & symbols
                  </p>
                </div>
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Role: {signUpForm.role.charAt(0).toUpperCase() + signUpForm.role.slice(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {signUpForm.role === 'donor' && 'Support projects and track your impact in real-time'}
                    {signUpForm.role === 'ngo' && 'Create projects and provide transparent progress updates'}
                    {signUpForm.role === 'validator' && 'Verify project milestones and ensure transparency'}
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 gradient-bg text-white hover:opacity-90 transition-all font-semibold" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Create Account
                    </div>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Trust Indicators */}
      <div className="flex justify-center items-center space-x-6 mt-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
        <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
          <Shield className="w-3 h-3 mr-1" />
          Secure
        </Badge>
        <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
          <Eye className="w-3 h-3 mr-1" />
          Transparent
        </Badge>
        <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
          <Heart className="w-3 h-3 mr-1" />
          Impactful
        </Badge>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
        Join 10,000+ users making transparent impact worldwide
      </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
