import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth as firebaseAuth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Flag, ArrowLeft, Mail, Lock, User as UserIcon, AtSign } from 'lucide-react';
import { validateUsername, checkUsernameAvailability } from '@/services/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setUsernameError('');

    if (value.length === 0) {
      return;
    }

    const cleanUsername = value.replace(/^@/, '').toLowerCase();
    const validation = validateUsername(cleanUsername);

    if (!validation.valid) {
      setUsernameError(validation.error || 'Invalid username');
      return;
    }

    // Check availability
    const isAvailable = await checkUsernameAvailability(cleanUsername);
    if (!isAvailable) {
      setUsernameError('Username is already taken');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (isSignUp) {
        // Validate username before submitting
        if (usernameError) {
          toast({
            title: 'Invalid username',
            description: usernameError,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const userCredential = await signUp(email, password, name, username);
        toast({
          title: 'Account created successfully!',
          description: 'Please check your email to verify your account.',
        });
        navigate('/onboarding');
      } else {
        console.log('[Login] Starting sign in...');
        const user = await signIn(email, password);
        console.log('[Login] Sign in successful, user:', user?.uid);

        if (!user) {
          throw new Error('Sign in failed - no user returned');
        }

        toast({ title: 'Welcome back!' });

        console.log('[Login] Fetching user document...');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        console.log('[Login] User document exists:', userDoc.exists());

        const userData = userDoc.data();
        console.log('[Login] User data:', userData);

        if (!userDoc.exists() || !userData?.onboardingCompleted) {
          console.log('[Login] Redirecting to onboarding');
          navigate('/onboarding');
        } else {
          console.log('[Login] Redirecting to home');
          navigate('/home');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, resetEmail);
      toast({
        title: 'Password reset email sent!',
        description: 'Check your inbox for instructions to reset your password.',
      });
      setResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative flex items-center justify-center p-4">
      {/* Animated background grid */}
      <div className="fixed inset-0 z-0">
        {/* Racing grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(220, 38, 38, 0.03) 49px, rgba(220, 38, 38, 0.03) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(220, 38, 38, 0.03) 49px, rgba(220, 38, 38, 0.03) 50px)
          `
        }} />

        {/* Animated speed lines */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
          <div className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
          <div className="absolute top-3/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_2.2s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-red-950/20 via-transparent to-black/50" />
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        className="fixed top-6 left-6 z-50 text-white hover:text-racing-red hover:bg-white/10 font-bold"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        BACK
      </Button>

      {/* Main content */}
      <Card className="w-full max-w-md relative z-10 bg-black/80 border-2 border-red-900/50 backdrop-blur-xl shadow-2xl shadow-red-500/10">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-racing-red rounded flex items-center justify-center">
                <Flag className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">
              <span className="text-white">BOX</span>
              <span className="text-racing-red">BOXD</span>
            </h1>
            <div className="inline-block px-6 py-2 bg-racing-red/20 border-2 border-racing-red rounded-full">
              <span className="text-racing-red font-black text-sm tracking-widest">
                {isSignUp ? 'JOIN THE GRID' : 'LIGHTS OUT'}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black tracking-wider text-gray-400 uppercase">Driver Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Your name"
                      className="pl-11 h-12 bg-black/50 border-2 border-red-900/50 focus:border-racing-red text-white placeholder:text-gray-600 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black tracking-wider text-gray-400 uppercase">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      required
                      placeholder="your_username"
                      className={`pl-11 h-12 bg-black/50 border-2 ${
                        usernameError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-red-900/50 focus:border-racing-red'
                      } text-white placeholder:text-gray-600 font-medium`}
                    />
                  </div>
                  {usernameError && (
                    <p className="text-xs text-red-500 font-medium mt-1">{usernameError}</p>
                  )}
                  {username && !usernameError && (
                    <p className="text-xs text-green-500 font-medium mt-1">Username is available!</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black tracking-wider text-gray-400 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="pl-11 h-12 bg-black/50 border-2 border-red-900/50 focus:border-racing-red text-white placeholder:text-gray-600 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black tracking-wider text-gray-400 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-black/50 border-2 border-red-900/50 focus:border-racing-red text-white placeholder:text-gray-600 font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider shadow-xl shadow-red-500/50 border-2 border-red-400 text-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  LOADING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  {isSignUp ? 'START ENGINES' : 'LIGHTS OUT'}
                </span>
              )}
            </Button>
          </form>

          {/* Footer links */}
          <div className="space-y-4 pt-4 border-t-2 border-red-900/30">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-gray-400 hover:text-white font-bold uppercase tracking-wider transition-colors"
            >
              {isSignUp ? '← Already on the grid? Sign in' : '→ New driver? Join the grid'}
            </button>

            {!isSignUp && (
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogTrigger asChild>
                  <button className="w-full text-sm text-racing-red hover:text-red-400 font-bold uppercase tracking-wider transition-colors">
                    Forgot Password?
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-black border-2 border-red-900/50">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-white tracking-tight">RESET PASSWORD</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePasswordReset} className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black tracking-wider text-gray-400 uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="pl-11 h-12 bg-black/50 border-2 border-red-900/50 focus:border-racing-red text-white placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setResetDialogOpen(false)}
                        className="flex-1 border-2 border-red-900/50 text-white hover:bg-white/10 font-bold uppercase"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 bg-racing-red hover:bg-red-600 text-white font-black uppercase shadow-lg shadow-red-500/50"
                      >
                        {resetLoading ? 'Sending...' : 'Send Link'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Legal links */}
          <div className="pt-6 border-t-2 border-red-900/30">
            <div className="flex flex-wrap justify-center gap-4 text-xs font-bold">
              <a href="/support" className="text-gray-500 hover:text-racing-red transition-colors uppercase tracking-wider">
                Support
              </a>
              <span className="text-gray-700">•</span>
              <a href="/privacy-policy" className="text-gray-500 hover:text-racing-red transition-colors uppercase tracking-wider">
                Privacy
              </a>
              <span className="text-gray-700">•</span>
              <a href="/terms-of-service" className="text-gray-500 hover:text-racing-red transition-colors uppercase tracking-wider">
                Terms
              </a>
            </div>
            <p className="text-xs text-gray-600 text-center mt-4 font-bold uppercase tracking-wider">
              © 2025 BoxBoxd
            </p>
          </div>
        </div>

        {/* Racing stripe decoration */}
        <div className="absolute top-0 left-0 w-2 h-full bg-racing-red" />
        <div className="absolute top-0 right-0 w-2 h-full bg-racing-red" />
      </Card>

      <style>{`
        @keyframes slide {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Login;
