import { useState } from 'react';
import Header from '@/components/Header';
import MaterialView from '@/components/MaterialView';
import NotebookEditor from '@/components/NotebookEditor';
import { LessonsSidebar } from '@/components/LessonsSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const Dashboard = () => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col w-full">
        <Header />
        
        <div className="flex flex-1 overflow-hidden w-full">
          <LessonsSidebar 
            selectedLessonId={selectedLessonId}
            onLessonSelect={setSelectedLessonId}
          />
          
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Panel - Material View */}
            <div className="w-full lg:w-1/2 xl:w-1/2 h-[50vh] lg:h-auto">
              <MaterialView selectedLessonId={selectedLessonId} />
            </div>

            {/* Right Panel - Notebook */}
            <div className="w-full lg:w-1/2 xl:w-1/2 h-[50vh] lg:h-auto">
              <NotebookEditor />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
