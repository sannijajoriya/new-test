
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Feedback } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useFeedbacks } from '@/hooks/use-data';
import { Skeleton } from './ui/skeleton';

export function FeedbackCarousel() {
  const { data: allFeedbacks, isLoading } = useFeedbacks();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi]);

  const approvedFeedbacks = useMemo(() => {
      if (!allFeedbacks) return [];
      return allFeedbacks
        .filter(f => f.status === 'approved')
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  }, [allFeedbacks]);


  useEffect(() => {
    if (approvedFeedbacks.length <= 1) return;
    const timer = setInterval(scrollNext, 5000); // Auto-slide every 5 seconds
    return () => clearInterval(timer);
  }, [approvedFeedbacks, scrollNext]);
  
  if (isLoading) {
    return (
        <section className="py-12 bg-muted/50 dark:bg-card/30">
             <div className="container mx-auto">
                 <div className="text-center mb-12">
                     <Skeleton className="h-9 w-1/2 mx-auto" />
                     <Skeleton className="h-5 w-3/4 mx-auto mt-3" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full md:block hidden" />
                    <Skeleton className="h-64 w-full lg:block hidden" />
                 </div>
             </div>
        </section>
    );
  }

  if (approvedFeedbacks.length === 0) {
    return null; // Don't render anything if there's no approved feedback
  }

  return (
    <section className="py-12 bg-muted/50 dark:bg-card/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">What Our Students Say</h2>
          <p className="text-muted-foreground mt-2">Hear from the students who trust UdaanSarthi.</p>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4 items-stretch">
            {approvedFeedbacks.map(feedback => (
              <div key={feedback.id} className="flex-grow-0 flex-shrink-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4">
                <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
                    <Avatar className="h-20 w-20 mb-4 border-4 border-primary/20">
                      <AvatarImage src={feedback.photoUrl} alt={feedback.fullName} data-ai-hint="person portrait" />
                      <AvatarFallback>{feedback.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="text-muted-foreground flex-grow italic">"{feedback.message}"</p>
                    <div className="mt-4">
                      <p className="font-semibold">{feedback.fullName}</p>
                      <p className="text-sm text-muted-foreground">{feedback.city}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
