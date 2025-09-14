import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { CareerRoadmap } from "@/components/CareerRoadmap";

const CareerRoadmapPage = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Career Roadmap</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <CareerRoadmap />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CareerRoadmapPage;
