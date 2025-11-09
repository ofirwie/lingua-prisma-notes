import Header from '@/components/Header';
import MaterialView from '@/components/MaterialView';
import NotebookEditor from '@/components/NotebookEditor';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Material View */}
        <div className="w-full lg:w-1/2 xl:w-1/2 h-[50vh] lg:h-auto">
          <MaterialView />
        </div>

        {/* Right Panel - Notebook */}
        <div className="w-full lg:w-1/2 xl:w-1/2 h-[50vh] lg:h-auto">
          <NotebookEditor />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
