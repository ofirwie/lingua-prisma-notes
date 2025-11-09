import { BookOpen } from 'lucide-react';

const MaterialView = () => {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Material View
        </h2>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Import a lesson to see your study material</p>
        </div>
      </div>
    </div>
  );
};

export default MaterialView;
