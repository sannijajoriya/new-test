
'use client'

import { AuthGuard } from '@/components/auth-guard';
import { AdminSidebar } from '@/components/admin-sidebar';
import { useUser } from '@/hooks/use-data';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();

  return (
    <AuthGuard role="admin">
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar user={user} />
        <main className="flex-1 md:ml-64">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
