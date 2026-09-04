import BottomNav from '@/components/layout/BottomNav';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
      <DashboardHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

