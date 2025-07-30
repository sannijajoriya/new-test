
import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { LoadingProvider } from '@/hooks/use-loading';
import { Loader } from '@/components/loader';
import { FloatingChatButton } from '@/components/floating-chat-button';
import { DataProvider } from '@/hooks/use-data';

export const metadata: Metadata = {
  title: 'UdaanSarthi - Your Trusted Guide for Every Exam Journey',
  description: 'AI-powered test preparation platform for competitive exams. Guided by AI. Designed for Results.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased animated-gradient-bg">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <AuthProvider>
              <DataProvider>
                  <Loader />
                  <div className="relative flex min-h-screen flex-col bg-background/80 backdrop-blur-xl">
                    <Header />
                    <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in-up">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                  <FloatingChatButton />
              </DataProvider>
            </AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
