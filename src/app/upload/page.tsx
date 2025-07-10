import { AppLayout } from "@/components/layouts/app-layout";
import { UploadWizard } from "@/components/upload/upload-wizard";

export default function UploadPage() {
  return (
    <AppLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Submit a Song</h1>
        <p className="text-muted-foreground">
          Follow the steps below to upload your music for review.
        </p>
      </div>
      <UploadWizard />
    </AppLayout>
  );
}
