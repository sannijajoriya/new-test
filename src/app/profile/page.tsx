
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { User, Mail } from 'lucide-react';
import { ImageUploader } from "@/components/image-uploader";
import { useData, useUser } from "@/hooks/use-data";

const profileSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')),
  profilePictureUrl: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function UpdateProfileForm() {
  const user = useUser();
  const { updateUser } = useData();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      profilePictureUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        profilePictureUrl: user.profilePictureUrl || "",
      });
    }
  }, [user, form]);


  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }

    try {
        await updateUser(user.id, data);
        toast({ title: "Success!", description: "Your profile has been updated." });
        form.reset(data, { keepValues: true }); // update form with new saved values but keep current view
    } catch (e) {
        toast({ title: "Error", description: "Could not update your profile.", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-3xl">Update Profile</CardTitle>
            <CardDescription>Keep your personal information up to date.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="profilePictureUrl"
                  render={({ field }) => (
                    <ImageUploader
                        value={field.value || ''}
                        onChange={field.onChange}
                        onCrop={(croppedValue) => field.onChange(croppedValue)}
                        label="Profile Photo"
                        description="A clear photo helps others recognize you. Upload a JPG, PNG, or WEBP file under 4MB."
                        aspect={1}
                        cropShape="round"
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                          <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="e.g., Jane Doe" {...field} className="pl-10" />
                          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                          <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="e.g., jane.doe@example.com" {...field} className="pl-10"/>
                          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


export default function UpdateProfilePage() {
    return <AuthGuard role="student"><UpdateProfileForm /></AuthGuard>
}
