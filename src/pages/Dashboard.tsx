import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getGreeting = () => {
    const greetings = {
      hebrew: 'שלום',
      english: 'Hello',
      italian: 'Ciao',
    };
    return greetings[language];
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Deutsche Lernen</h1>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <h2 className="text-3xl font-bold mb-2">
              {getGreeting()}, {user?.user_metadata?.name || 'Student'}!
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Welcome to your German learning dashboard
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Your learning journey starts here.</p>
              <p className="mt-2">More features coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
