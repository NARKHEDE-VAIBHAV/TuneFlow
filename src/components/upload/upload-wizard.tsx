"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription as FormDescriptionUI, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSongAction, processPaidSubmissionAction } from "@/app/actions";
import { Loader2, PartyPopper, ArrowLeft, ArrowRight, IndianRupee, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { User, PriceSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings } from "@/app/admin/data-actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ACCEPTED_IMAGE_TYPES = ["image/png"];
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg"];

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  author: z.string().min(2, { message: "Author name must be at least 2 characters." }),
  singer: z.string().min(2, { message: "Singer name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  tags: z.string().optional(),
  banner: z.any()
    .refine((files) => files?.length === 1, "Banner image is required.")
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), "Only .png files are accepted for the banner."),
  file: z.any()
    .refine((files) => files?.length === 1, "Music file is required.")
    .refine((files) => ACCEPTED_AUDIO_TYPES.includes(files?.[0]?.type), "Only .mp3 files are accepted for the music file."),
});

type FormData = z.infer<typeof formSchema>;

// Helper function to convert a file to a Base64 Data URI
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export function UploadWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [prices, setPrices] = useState<PriceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccountType, setSelectedAccountType] = useState<User['accountType']>('Normal Artist');

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    const subscribed = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : false;
    setIsSubscribed(subscribed);
    setSelectedAccountType(user.accountType); // Default to user's current type
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (currentUser && !isSubscribed) {
      const fetchPrices = async () => {
        try {
          const settings = await getSettings();
          setPrices(settings.prices);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch subscription prices.' });
        }
      };
      fetchPrices();
    }
  }, [currentUser, isSubscribed, toast]);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      singer: "",
      description: "",
      tags: "",
    },
    mode: "onChange"
  });

  const handleFormSubmit = async (values: FormData) => {
    if (!currentUser) return;
    
    // Always trigger validation
    const isValid = await form.trigger();
    if (!isValid) {
      toast({ variant: 'destructive', title: 'Invalid Details', description: 'Please fill out all required fields correctly.' });
      return;
    }

    if (isSubscribed) {
        setIsSubmitting(true);
        try {
            const bannerDataUrl = await fileToDataUrl(values.banner[0]);
            const audioDataUrl = await fileToDataUrl(values.file[0]);

            const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
            const result = await saveSongAction({
                userId: currentUser.id,
                title: values.title,
                author: values.author,
                singer: values.singer,
                description: values.description,
                tags: tagsArray,
                bannerDataUrl: bannerDataUrl,
                audioDataUrl: audioDataUrl,
            });

            if (result.success) {
                setStep(3); // success step
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'File Error', description: 'Could not read files for upload.' });
        } finally {
            setIsSubmitting(false);
        }
    } else {
      // Not subscribed, go to payment
      setStep(2);
    }
  };


  const handleRazorpayPayment = () => {
    if (!prices || !currentUser || !selectedAccountType) {
        toast({ variant: 'destructive', title: 'Error', description: 'Price or user information is missing.' });
        return;
    }
    const price = prices[selectedAccountType];
    setIsSubmitting(true);
    const options = {
      key: "rzp_test_1DPvRWap8Krr8D",
      amount: price * 100, // Amount in paise
      currency: "INR",
      name: "TuneFlow",
      description: `1-Year Subscription for ${selectedAccountType}`,
      image: "https://placehold.co/100x100.png",
      handler: async (response: any) => {
        const values = form.getValues();
        
        try {
            const bannerDataUrl = await fileToDataUrl(values.banner[0]);
            const audioDataUrl = await fileToDataUrl(values.file[0]);

            const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
            const submissionData = {
              userId: currentUser.id,
              title: values.title,
              author: values.author,
              singer: values.singer,
              description: values.description,
              tags: tagsArray,
              accountType: selectedAccountType,
              bannerDataUrl: bannerDataUrl,
              audioDataUrl: audioDataUrl,
            };

            const result = await processPaidSubmissionAction(submissionData);
            
            if (result.success) {
              setStep(3);
            } else {
              toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'File Error', description: 'Could not process files after payment.' });
        } finally {
            setIsSubmitting(false);
        }
      },
      prefill: {
        name: currentUser?.name || '',
        email: currentUser?.email || '',
      },
      notes: {
        title: form.getValues("title"),
        userId: currentUser.id,
      },
      theme: {
        color: "#6366F1",
      },
      modal: {
        ondismiss: () => {
          setIsSubmitting(false);
          toast({
            variant: "destructive",
            title: "Payment Cancelled",
            description: "The payment process was not completed.",
          });
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay error: ", error);
      toast({ variant: 'destructive', title: 'Error', description: "Could not initialize payment." });
      setIsSubmitting(false);
    }
  };
  
  const handlePrevStep = () => setStep(step - 1);

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)}>
              <CardHeader>
                <CardTitle className="font-headline">Submit Your Track</CardTitle>
                 {isSubscribed ? (
                    <CardDescription className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" /> Your subscription is active. You can submit songs freely.
                    </CardDescription>
                ) : (
                    <CardDescription>Fill in your song details below. A one-time payment is required to get a 1-year subscription.</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField name="title" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. Midnight Wanderer" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="author" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Author</FormLabel><FormControl><Input placeholder="e.g. Alex Ray" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="singer" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Singer</FormLabel><FormControl><Input placeholder="e.g. Luna" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="description" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe your song..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="tags" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl><Input placeholder="e.g. synthwave, electronic, 80s" {...field} /></FormControl>
                    <FormDescriptionUI>Separate tags with a comma.</FormDescriptionUI>
                    <FormMessage />
                  </FormItem>
                )} />

                 {!isSubscribed && (
                    <div className="space-y-3 rounded-lg border p-4">
                        <Label className="text-base font-semibold">Choose Your Subscription Plan</Label>
                        <RadioGroup
                          onValueChange={(value: User['accountType']) => setSelectedAccountType(value)}
                          value={selectedAccountType}
                          className="space-y-2"
                        >
                          <Label className="flex cursor-pointer items-center space-x-3 space-y-0 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent hover:bg-accent">
                            <RadioGroupItem value="Normal Artist" />
                            <span className="flex w-full justify-between font-normal">
                              <span>Normal Artist</span>
                              {prices ? <span className="font-bold">₹{prices['Normal Artist']}</span> : <Skeleton className="h-5 w-12" />}
                            </span>
                          </Label>
                          <Label className="flex cursor-pointer items-center space-x-3 space-y-0 rounded-md border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent hover:bg-accent">
                             <RadioGroupItem value="Label" />
                            <span className="flex w-full justify-between font-normal">
                              <span>Label</span>
                               {prices ? <span className="font-bold">₹{prices['Label']}</span> : <Skeleton className="h-5 w-12" />}
                            </span>
                          </Label>
                        </RadioGroup>
                    </div>
                  )}

                <FormField name="banner" control={form.control} render={({ field: { onChange, value, ...rest }}) => (
                    <FormItem>
                        <FormLabel>Banner Image (PNG only)</FormLabel>
                        <FormControl><Input type="file" accept="image/png" {...rest} onChange={(e) => onChange(e.target.files)} /></FormControl>
                         <FormDescriptionUI>A high-resolution 3000x3000px banner is recommended.</FormDescriptionUI>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField name="file" control={form.control} render={({ field: { onChange, value, ...rest }}) => (
                    <FormItem>
                        <FormLabel>Music File (MP3 only)</FormLabel>
                        <FormControl><Input type="file" accept="audio/mpeg" {...rest} onChange={(e) => onChange(e.target.files)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="ml-auto" disabled={isSubmitting || (!isSubscribed && !prices)}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubscribed ? "Submit Song" : "Proceed to Payment"}
                  {!isSubscribed && <ArrowRight className="ml-2 h-4 w-4"/>}
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        );
      case 2:
        return (
           <>
              <CardHeader>
                <CardTitle className="font-headline">Final Step: Subscription Payment</CardTitle>
                <CardDescription>Complete the payment to activate your 1-year subscription and submit your song.</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4 py-12">
                  <div className="mx-auto w-fit rounded-full bg-primary/10 p-4 text-primary">
                    <IndianRupee className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-semibold">1-Year Subscription for {selectedAccountType}</p>
                   {prices === null ? (
                        <Skeleton className="h-10 w-48 mx-auto" />
                   ) : (
                        <p className="text-4xl font-bold font-headline">₹{prices[selectedAccountType!].toFixed(2)}</p>
                   )}
                  <p className="text-muted-foreground">This fee helps us maintain the platform and review submissions.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handlePrevStep} disabled={isSubmitting}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                <Button onClick={handleRazorpayPayment} disabled={isSubmitting || prices === null}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Pay & Submit
                </Button>
              </CardFooter>
            </>
        )
      case 3:
        return (
          <>
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4 py-20">
              <PartyPopper className="h-16 w-16 text-primary" />
              <h2 className="text-2xl font-bold font-headline">Submission Complete!</h2>
              <p className="text-muted-foreground">
                Your song has been submitted for review. You can check its status on your dashboard.
              </p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </>
        );
      default:
        return null;
    }
  };

  return <Card className="w-full max-w-2xl mx-auto">{renderStep()}</Card>;
}
