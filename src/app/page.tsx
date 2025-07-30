
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, BrainCircuit, MessageSquare, FileDown, Flag, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FeedbackCarousel } from '@/components/feedback-carousel';
import { NewsBannerPopup } from '@/components/news-banner-popup';
import { useSiteSettings } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { settings } = useSiteSettings();

  const features = [
    {
      icon: <BrainCircuit className="h-8 w-8 text-primary" />,
      mainTitle: 'UdaanSarthi AI Assistant',
      subTitle: 'Your True Exam Guide',
      description: 'Meet our smart AI-powered chatbot assistant that helps you solve doubts, even through image-based questions. It responds in Hindi & English with accurate, student-friendly solutions. Like a true “Saarthi” for your exam journey.',
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      mainTitle: 'Chat with Founder & Admin',
      subTitle: 'Direct Communication',
      description: 'Talk directly with the platform admin and founder for support and guidance. Get personalized help, resolve issues, or share feedback in real-time chat.',
    },
    {
      icon: <FileDown className="h-8 w-8 text-primary" />,
      mainTitle: 'Personalized Analytics + PDF Report',
      subTitle: 'Track. Improve. Succeed.',
      description: 'Detailed performance analysis for every test. Get downloadable PDF reports for revision, self-tracking, and progress comparison.',
    },
    {
      icon: <Flag className="h-8 w-8 text-primary" />,
      mainTitle: 'Raise Objections & Rank-Based Tracking',
      subTitle: 'Your Voice Matters',
      description: 'Found a mistake or unclear question? Raise an objection directly from the test. Track your All-India Rank and test-based ranking progression.',
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      mainTitle: 'Free Test Access – Always First & Best',
      subTitle: 'Practice Without Limits',
      description: 'Get early access to top-quality test series — completely free. Stay ahead with the most reliable mock exams and practice tests.',
    },
  ];

  const heroText = settings?.heroBannerText || '\n';
  const [title, ...subtitles] = heroText.split('\n');

  return (
    <>
    <NewsBannerPopup />
    <div className="space-y-20 md:space-y-32">
      {/* Hero Section */}
      <section className="text-center flex flex-col items-center">
         <div className="relative w-full rounded-2xl overflow-hidden bg-muted/30 aspect-[4/3] md:aspect-[2.5/1]">
             {settings ? (
                <Image 
                    src={settings.heroBannerImageUrl || "https://placehold.co/1200x480.png"}
                    alt="A student's journey towards success" 
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="student journey achievement"
                    priority
                />
             ) : (
                <Skeleton className="h-full w-full" />
             )}
             <div 
                className="absolute inset-0 flex flex-col items-center justify-center text-white p-4"
                style={{ backgroundColor: `rgba(0, 0, 0, ${settings?.heroBannerOverlayOpacity ?? 0})` }}
             >
                {settings?.isHeroBannerTextEnabled && (
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-50 to-blue-300 drop-shadow-lg whitespace-pre-wrap">
                            {title}
                        </h1>
                        <p className="mt-4 text-lg md:text-xl max-w-3xl text-primary-foreground/90 font-medium whitespace-pre-wrap">
                           {subtitles.join('\n')}
                        </p>
                    </div>
                )}
             </div>
        </div>
        <div className="mt-8 md:-mt-8 md:z-10">
          <Button asChild size="lg" className="rounded-full">
              <Link href="/signup"><Rocket className="mr-2 h-5 w-5" /> Start Your Udaan</Link>
          </Button>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Why Choose UdaanSarthi?</h2>
          <p className="text-muted-foreground mt-2">Discover the unique features that make UdaanSarthi your ultimate exam companion.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {features.map((feature, index) => (
            <Card key={index} className="text-center group perspective-1000">
              <div className="transition-all duration-500 group-hover:transform-style-3d group-hover:rotate-y-12 h-full flex flex-col">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                        {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <h3 className="text-xl font-bold">{feature.mainTitle}</h3>
                    <p className="text-sm font-semibold text-primary/90 mt-1">{feature.subTitle}</p>
                    <p className="text-muted-foreground mt-4 text-sm">{feature.description}</p>
                  </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Student Feedback Section */}
      <FeedbackCarousel />

      {/* Call to Action Section */}
      <section className="text-center bg-card/50 py-16 rounded-lg border">
          <h2 className="text-3xl font-bold">Ready to Begin?</h2>
          <p className="text-muted-foreground mt-2">Join thousands of successful students today.</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="rounded-full w-full sm:w-auto">
                <Link href="/signup">Create an Account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full w-full sm:w-auto">
                <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
      </section>
    </div>
    </>
  );
}
