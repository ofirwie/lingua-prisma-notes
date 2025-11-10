import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Upload, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">🇩🇪 Deutsche Lernen</h1>
          </div>
          <Button onClick={() => navigate('/auth')} size="lg">
            Sign In / Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Learn German the Organized Way
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Digital textbook + personal notebook in one place.
            <br />
            Import your vocabulary, translate to Hebrew, English and Italian, and take notes.
          </p>
          <Button onClick={() => navigate('/auth')} size="lg" className="text-lg px-8 py-6">
            Start Learning Now
            <Sparkles className="mr-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          <div className="bg-card border border-border rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Easy Import</h3>
            <p className="text-muted-foreground">
              Upload a CSV file with vocabulary from your lessons and everything will be organized automatically
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Organized Study Material</h3>
            <p className="text-muted-foreground">
              View all words with translations in three languages, organized by categories and lessons
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Digital Notebook</h3>
            <p className="text-muted-foreground">
              Take notes with a rich text editor, with automatic saving for each lesson
            </p>
          </div>
        </div>

        {/* Screenshot Preview */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-muted/50 border-b border-border px-6 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-6 min-h-[400px]">
              <div className="bg-muted/30 rounded-lg p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Study Material</span>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-2 opacity-20" />
                    <p>View organized vocabulary</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Personal Notebook</span>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-2 opacity-20" />
                    <p>Take notes with text editor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h3 className="text-3xl font-bold mb-4">Ready to Start?</h3>
          <p className="text-muted-foreground mb-6">Join now and start learning German more effectively</p>
          <Button onClick={() => navigate('/auth')} size="lg" className="text-lg px-8 py-6">
            Create Free Account
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Deutsche Lernen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
