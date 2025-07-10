import { AdminLayout } from "@/components/layouts/admin-layout";
import { DashboardClient } from "./dashboard-client";
import { getAllUsers, getPendingSongs } from "../data-actions";

export default async function AdminDashboardPage() {
  // This is now a Server Component. It runs on the server for each request/navigation.
  // It will read the current state of mockSongs in memory for the current request.
  const pendingSongs = await getPendingSongs();
  const users = await getAllUsers();

  return (
    <AdminLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Review and moderate new song submissions.
        </p>
      </div>
      {/* Pass the fresh data to the client component */}
      <DashboardClient initialSongs={pendingSongs} initialUsers={users} />
    </AdminLayout>
  );
}
