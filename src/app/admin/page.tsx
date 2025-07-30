
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Library, Flag, FilePenLine, MessageSquare, Settings, Star } from 'lucide-react';
import Link from 'next/link';
import { useStudents, useTests, useCategories, useReports } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ title, value, icon: Icon, link, isLoading }: { title: string, value: number, icon: React.ElementType, link: string, isLoading: boolean }) {
  return (
    <Link href={link}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { students, isLoading: isLoadingStudents } = useStudents();
  const { data: tests, isLoading: isLoadingTests } = useTests();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: reports, isLoading: isLoadingReports } = useReports();

  const isLoading = isLoadingStudents || isLoadingTests || isLoadingCategories || isLoadingReports;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">An overview of your platform's activity.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={students?.length || 0} icon={Users} link="/admin/students" isLoading={isLoading} />
        <StatCard title="Total Tests" value={tests?.length || 0} icon={FileText} link="/admin/tests" isLoading={isLoading} />
        <StatCard title="Total Categories" value={categories?.length || 0} icon={Library} link="/admin/tests" isLoading={isLoading} />
        <StatCard title="Total Reports" value={reports?.length || 0} icon={Flag} link="/admin/reports" isLoading={isLoading} />
      </div>
       <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/admin/tests" className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-center transition-colors">
              <FilePenLine className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">Manage Tests</p>
            </Link>
            <Link href="/admin/students" className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-center transition-colors">
              <Users className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">Manage Students</p>
            </Link>
            <Link href="/admin/chat" className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-center transition-colors">
              <MessageSquare className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">Student Chat</p>
            </Link>
             <Link href="/admin/feedback" className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-center transition-colors">
              <Star className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">Feedback</p>
            </Link>
            <Link href="/admin/settings" className="p-4 bg-muted hover:bg-muted/80 rounded-lg text-center transition-colors">
              <Settings className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">Site Settings</p>
            </Link>
          </CardContent>
       </Card>
    </div>
  );
}
