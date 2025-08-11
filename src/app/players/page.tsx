"use client";

import { PlayerForm } from "@/components/players/player-form";
import { PlayerList } from "@/components/players/player-list";
import { PlayerRankings } from "@/components/players/player-rankings";

export default function PlayersPage() {
  return (
    <div className="space-y-8">
      <PlayerForm />
      <PlayerRankings />
      <PlayerList />
    </div>
  );
}
