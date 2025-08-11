"use client";

import { AdminGate } from "@/components/admin-gate";
import { LiveScoringDashboard } from "@/components/live-scoring/live-scoring-dashboard";

export default function LiveScoringPage() {
    return (
        <AdminGate>
            <LiveScoringDashboard />
        </AdminGate>
    );
}
