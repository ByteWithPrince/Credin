'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Lightbulb, Activity, TrendingUp, User } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', path: '/overview', icon: Home },
    { name: 'What-If', path: '/what-if', icon: Lightbulb },
    { name: 'Score', path: '/score', icon: Activity },
    { name: 'Optimizer', path: '/optimizer', icon: TrendingUp },
    { name: 'Plan', path: '/improvement', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-50 px-4 pb-safe pt-2 md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.path);
          const Icon = tab.icon;
          
          return (
            <Link 
              key={tab.name} 
              href={tab.path} 
              className={cn(
                "flex flex-col items-center gap-1 p-2 text-muted-foreground transition-all duration-200",
                isActive && "text-primary -translate-y-1"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
