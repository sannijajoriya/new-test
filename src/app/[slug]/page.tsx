
import { getPostData, getAllPostIds } from '@/lib/posts';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Rocket } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Generate metadata for each post
export async function generateMetadata({ params }): Promise<Metadata> {
  try {
    const postData = await getPostData(params.slug);
    return {
      title: `${postData.title} | UdaanSarthi Blog`,
      description: postData.description,
    };
  } catch (error) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }
}

// Generate static paths for all posts
export async function generateStaticParams() {
  const paths = getAllPostIds();
  return paths.map(({ slug }) => ({
    slug,
  }));
}


export default async function Post({ params }) {
  try {
    const postData = await getPostData(params.slug);
    const postDate = format(new Date(postData.date), 'MMMM d, yyyy');

    return (
        <div className="container mx-auto max-w-8xl py-8">
            <article>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl font-extrabold tracking-tight lg:text-5xl">{postData.title}</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground mt-2">
                           Published on {postDate}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div 
                            className="prose dark:prose-invert max-w-none" 
                            dangerouslySetInnerHTML={{ __html: postData.contentHtml }} 
                        />
                    </CardContent>
                </Card>
            </article>
            <div className="mt-8 text-center flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button variant="outline" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft />
                        Back to Home
                    </Link>
                </Button>
                 <Button variant="default" asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Rocket />
                        Start Test Now
                    </Link>
                </Button>
            </div>
        </div>
    );
  } catch (error) {
    notFound();
  }
}
