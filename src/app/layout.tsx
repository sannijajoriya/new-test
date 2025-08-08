
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
export const metadata: Metadata = {
  title: 'UdaanSarthi - राजस्थान की हर परीक्षा का भरोसेमंद साथी',
  description: 'UdaanSarthi पर मिले राजस्थान की हर बड़ी परीक्षा जैसे 4th ग्रेड, पटवारी, REET, CET, पुलिस और लैब असिस्टेंट के लिए सटीक और दमदार टेस्ट सीरीज़। टॉपिक-वाइज और सब्जेक्ट-वाइज मॉक टेस्ट्स, एकदम असली पेपर के पैटर्न पर। तैयारी वहीं से शुरू होती है जहाँ भरोसा होता है — UdaanSarthi।',
  keywords: [
    'UdaanSarthi',
    'Rajasthan Test Series',
    '4th Grade Test Rajasthan',
    'Patwari Mock Test',
    'CET Rajasthan',
    'REET Practice',
    'Lab Assistant',
    'Rajasthan Police',
    'Mock Test Rajasthan',
  ],
  icons: {
    icon: '/favicon.ico',
  },
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
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
                  <Loader />
                  <div className="relative flex min-h-screen flex-col bg-background/80 backdrop-blur-xl">
                    <Header />
                    <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in-up">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                  <FloatingChatButton />
            </AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
