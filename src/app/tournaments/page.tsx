"use client";

import { TournamentForm } from "@/components/tournaments/tournament-form";
import { TournamentList } from "@/components/tournaments/tournament-list";
import { NameGenerator } from "@/components/tournaments/name-generator";

export default function TournamentsPage() {
  return (
    <div className="space-y-8">
      <TournamentForm />
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">All Tournaments</h2>
        <TournamentList />
      </div>
      <div className="mt-8">
          <NameGenerator />
      </div>
    </div>
  );
}
