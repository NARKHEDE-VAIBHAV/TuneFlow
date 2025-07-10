import { AdminLayout } from "@/components/layouts/admin-layout";
import { getSettings } from "../data-actions";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <AdminLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Platform Settings
        </h1>
        <p className="text-muted-foreground">
          Manage subscription prices and other platform settings.
        </p>
      </div>
      <SettingsClient initialSettings={settings} />
    </AdminLayout>
  );
}
