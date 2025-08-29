"use client";

import { getPostData, getAllPostIds } from "@/lib/posts";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PostParams = {
  params: {
    slug: string;
  };
};

// ✅ Metadata function
export async function generateMetadata({ params }: PostParams): Promise<Metadata> {
  try {
    const postData = await getPostData(params.slug);
    return {
      title: `${postData.title} | UdaanSarthi Blog`,
      description: postData.description || "Read detailed articles on UdaanSarthi Blog.",
    };
  } catch (error) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }
}

// ✅ Static Params
export async function generateStaticParams() {
  const paths = getAllPostIds();
  return paths.map(({ slug }) => ({
    slug,
  }));
}

// ✅ Main Component
export default async function Post({ params }: PostParams) {
  try {
    const postData = await getPostData(params.slug);

    if (!postData) {
      notFound();
    }

    const postDate = postData.date ? format(new Date(postData.date), "MMMM d, yyyy") : "Unknown Date";

    return (
      <div className="container mx-auto max-w-4xl py-8">
        <article>
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                {postData.title}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-2">
                Published on {postDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
              />
            </CardContent>
          </Card>
        </article>

        {/* Back Button */}
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
