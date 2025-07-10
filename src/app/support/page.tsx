import { AppLayout } from "@/components/layouts/app-layout";
import { TicketList } from "@/components/support/ticket-list";
import { Button } from "@/components/ui/button";
import { FilePlus2 } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between space-y-2 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Support Center
          </h1>
          <p className="text-muted-foreground">
            Manage your support tickets and find help.
          </p>
        </div>
        <Button asChild>
          <Link href="/support/new">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create New Ticket
          </Link>
        </Button>
      </div>
      <TicketList />
    </AppLayout>
  );
}
