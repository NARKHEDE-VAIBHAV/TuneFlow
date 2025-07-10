"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AppSettings } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { updatePriceSettingsAction } from "../actions";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  normalArtistPrice: z.coerce.number().min(0, "Price must be a positive number."),
  labelPrice: z.coerce.number().min(0, "Price must be a positive number."),
});

type FormData = z.infer<typeof settingsSchema>;

interface SettingsClientProps {
  initialSettings: AppSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      normalArtistPrice: initialSettings.prices['Normal Artist'],
      labelPrice: initialSettings.prices['Label'],
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    const result = await updatePriceSettingsAction({
      'Normal Artist': values.normalArtistPrice,
      'Label': values.labelPrice,
    });

    if (result.success) {
      toast({ title: "Success", description: result.message });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="max-w-2xl">
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                    <CardTitle>Subscription Prices</CardTitle>
                    <CardDescription>
                        Set the yearly subscription price (in INR) for each account type.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="normalArtistPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Normal Artist Price (₹)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 999" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="labelPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Label Price (₹)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 1999" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </FormProvider>
    </Card>
  );
}
