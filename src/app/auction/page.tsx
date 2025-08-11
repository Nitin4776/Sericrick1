"use client";

import { AdminGate } from "@/components/admin-gate";
import { AuctionDashboard } from "@/components/auction/auction-dashboard";

export default function AuctionPage() {
    return (
        <AdminGate>
            <AuctionDashboard />
        </AdminGate>
    )
}
