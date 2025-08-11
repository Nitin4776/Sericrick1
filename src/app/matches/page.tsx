"use client";

import { MatchForm } from "@/components/matches/match-form";
import { MatchList } from "@/components/matches/match-list";

export default function MatchesPage() {
  return (
    <div className="space-y-8">
      <MatchForm />
      <MatchList />
    </div>
  );
}
