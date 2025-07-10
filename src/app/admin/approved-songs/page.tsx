import { AdminLayout } from "@/components/layouts/admin-layout";
import { ApprovedSongsTable } from "./approved-songs-table";
import { getApprovedSongs, getAllUsers } from "../data-actions";

export default async function ApprovedSongsPage() {
  // This runs on the server, so it will always get the up-to-date mockSongs array
  // after a server action with revalidatePath has run.
  const approvedSongs = await getApprovedSongs();
  const users = await getAllUsers();

  return (
    <AdminLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Approved Songs
        </h1>
        <p className="text-muted-foreground">
          A list of all songs that have been approved on the platform.
        </p>
      </div>
      {/* The serializable props `approvedSongs` and `users` are passed to the client component */}
      <ApprovedSongsTable songs={approvedSongs} users={users} />
    </AdminLayout>
  );
}
