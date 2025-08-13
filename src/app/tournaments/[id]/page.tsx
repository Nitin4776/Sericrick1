import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Tournament } from "@/lib/types";
import { TournamentDetailPageClient } from "@/components/tournaments/tournament-detail-page";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
    try {
        const tournamentsCollection = collection(db, 'tournaments');
        const tournamentSnapshot = await getDocs(tournamentsCollection);
        const tournaments = tournamentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
        
        return tournaments.map((tournament) => ({
          id: tournament.id,
        }));
    } catch (error) {
        console.error("Failed to generate static params:", error);
        return [];
    }
}

async function getTournament(id: string): Promise<Tournament | null> {
    try {
        const tournamentDoc = await getDoc(doc(db, "tournaments", id));
        if (!tournamentDoc.exists()) {
            return null;
        }
        return { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament;
    } catch (error) {
        console.error("Failed to fetch tournament:", error);
        return null;
    }
}


export default async function TournamentPage({ params }: { params: { id: string } }) {
    const tournament = await getTournament(params.id);

    if (!tournament) {
        notFound();
    }

    return <TournamentDetailPageClient tournament={tournament} />;
}
