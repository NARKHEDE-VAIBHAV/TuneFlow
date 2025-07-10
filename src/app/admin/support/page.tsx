import { AdminLayout } from "@/components/layouts/admin-layout";
import { getAllTickets, getAllUsers } from "../data-actions";
import { SupportClient } from "./support-client";

export default async function AdminSupportPage() {
  const tickets = await getAllTickets();
  const users = await getAllUsers();

  return (
    <AdminLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Support Tickets
        </h1>
        <p className="text-muted-foreground">
          Review and respond to user support requests.
        </p>
      </div>
      <SupportClient initialTickets={tickets} initialUsers={users} />
    </AdminLayout>
  );
}
