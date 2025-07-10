import { AdminLayout } from "@/components/layouts/admin-layout";
import { getAllUsers } from "../data-actions";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <AdminLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions.
        </p>
      </div>
      <UsersClient initialUsers={users} />
    </AdminLayout>
  );
}
