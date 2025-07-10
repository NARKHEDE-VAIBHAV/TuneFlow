import { AdminLayout } from "@/components/layouts/admin-layout";
import { WithdrawalsClient } from "./withdrawals-client";
import { getAllWithdrawals, getAllUsers, getPlatformFinancials } from "../data-actions";
import { FinancialStatsWrapper } from "./financial-stats-wrapper";

export default async function AdminWithdrawalsPage() {
  const withdrawals = await getAllWithdrawals();
  const users = await getAllUsers();
  const financials = await getPlatformFinancials();

  return (
    <AdminLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Withdrawal Requests
        </h1>
        <p className="text-muted-foreground">
          Manage and process user withdrawal requests and view platform financials.
        </p>
      </div>

      <FinancialStatsWrapper stats={financials} />

      <div className="mt-8">
        <WithdrawalsClient initialWithdrawals={withdrawals} initialUsers={users} />
      </div>
    </AdminLayout>
  );
}
