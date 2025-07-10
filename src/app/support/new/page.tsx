import { AppLayout } from "@/components/layouts/app-layout";
import { NewTicketForm } from "@/components/support/new-ticket-form";

export default function NewTicketPage() {
  return (
    <AppLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Create a New Support Ticket
        </h1>
        <p className="text-muted-foreground">
          Describe your issue below and our team will get back to you.
        </p>
      </div>
      <NewTicketForm />
    </AppLayout>
  );
}
