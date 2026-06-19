'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isOwner = pathname.startsWith('/owner');
  const isDashboard = isAdmin || isOwner;

  return (
    <>
      {!isDashboard && <Navbar />}
      {isDashboard ? (
        <>{children}</>
      ) : (
        <main className="pt-20 md:pt-24">
          {children}
        </main>
      )}
    </>
  );
}

