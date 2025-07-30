
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import type { Feedback } from "@/lib/types";
import { ImageUploader } from "@/components/image-uploader";
import { useFeedbacks, useUser } from "@/hooks/use-data";

const feedbackSchema = z.object({
  city: z.string().min(2, { message: "City must be at least 2 characters long." }),
  message: z.string().min(10, { message: "Feedback must be at least 10 characters long." }),
  photoUrl: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

function FeedbackForm() {
  const user = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { data: feedbacks, updateFeedbacks } = useFeedbacks();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { city: "", message: "", photoUrl: "" },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user || !updateFeedbacks) {
      toast({ title: "Error", description: "You must be logged in to submit feedback.", variant: "destructive" });
      return;
    }

    try {
      const newFeedback: Feedback = {
        id: Date.now().toString(),
        studentId: user.id,
        fullName: user.fullName,
        city: data.city,
        message: data.message,
        photoUrl: data.photoUrl,
        createdAt: Date.now(),
        status: "pending",
        order: feedbacks?.length || 0,
      };
      
      const updatedFeedbacks = [...(feedbacks || []), newFeedback];

      await updateFeedbacks(updatedFeedbacks);

      toast({
        title: "Feedback Submitted!",
        description: "Thank you! Your feedback will be reviewed by our team.",
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save feedback:", error);
      toast({ title: "Submission Failed", description: "Could not save your feedback. Please try again later.", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl">Share Your Feedback</CardTitle>
            <CardDescription>We'd love to hear about your experience with UdaanSarthi.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={user?.fullName || "Loading..."} disabled />
                  </div>
                   <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jaipur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Message</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="Tell us what you think..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <ImageUploader
                        value={field.value || ''}
                        onChange={field.onChange}
                        onCrop={field.onChange}
                        label="Photo (Optional)"
                        description="Showcase yourself! A photo makes your feedback more personal."
                        aspect={1}
                        cropShape="round"
                      />
                    )}
                  />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function FeedbackPage() {
    return <AuthGuard role="student"><FeedbackForm /></AuthGuard>
}
