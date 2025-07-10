import { AppLayout } from "@/components/layouts/app-layout";
import { WalletClient } from "./wallet-client";

export default function WalletPage() {
    return (
        <AppLayout>
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    My Wallet
                </h1>
                <p className="text-muted-foreground">
                    View your earnings, manage withdrawals, and see your transaction history.
                </p>
            </div>
            <WalletClient />
        </AppLayout>
    );
}
