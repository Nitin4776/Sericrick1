"use client";

import { useAppContext } from "@/context/app-context";
import type { Player } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Shield, Star } from "lucide-react";
import React from "react";

function RankingList({ players, statKey, statLabel, fixed = 2 }: { players: Player[], statKey: keyof Player['stats'], statLabel: string, fixed?: number }) {
  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough data for rankings.</p>
  }
  return (
    <ol className="space-y-2">
      {players.map((p, index) => (
        <li key={p.id} className="flex items-center justify-between text-sm">
          <span className="flex items-center">
            <span className="font-semibold w-5">{index + 1}.</span> {p.name}
          </span>
          <div className="flex items-baseline">
            <span className="font-mono text-primary">
              {(p.stats[statKey] as number).toFixed(fixed)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">{statLabel}</span>
            <span className="text-xs text-muted-foreground ml-2">({p.stats?.matches || 0} M)</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function AllRounderRankingList({ players }: { players: Player[] }) {
    if (players.length === 0) {
        return <p className="text-sm text-muted-foreground">Not enough data for rankings.</p>
    }
    return (
        <ol className="space-y-2">
            {players.map((p, index) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                        <span className="font-semibold w-5">{index + 1}.</span> {p.name}
                    </span>
                     <div className="flex items-baseline">
                        <span className="font-mono text-primary">
                            {p.stats.runs} <span className="text-xs text-muted-foreground">R</span> / {p.stats.wickets} <span className="text-xs text-muted-foreground">W</span>
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">({p.stats?.matches || 0} M)</span>
                    </div>
                </li>
            ))}
        </ol>
    );
}

export function PlayerRankings() {
  const { calculateRankings } = useAppContext();
  const { bestBatsmen, bestBowlers, bestAllrounders } = calculateRankings();

  const rankingCategories = [
    { title: 'Best Batsmen', icon: <Trophy className="h-6 w-6 text-yellow-500" />, players: bestBatsmen, statKey: 'runs', statLabel: 'Runs', fixed: 0 },
    { title: 'Best Bowlers', icon: <Shield className="h-6 w-6 text-blue-500" />, players: bestBowlers, statKey: 'wickets', statLabel: 'Wkts', fixed: 0 },
    { title: 'Best All-rounders', icon: <Star className="h-6 w-6 text-green-500" />, players: bestAllrounders }
  ]

  return (
    <div>
        <h2 className="text-2xl font-bold mb-4 tracking-tight">Player Rankings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rankingCategories.map(cat => (
                 <Card key={cat.title}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {cat.icon}
                            <span>{cat.title}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cat.title === 'Best All-rounders' ? 
                            <AllRounderRankingList players={cat.players} /> :
                            <RankingList players={cat.players} statKey={cat.statKey as keyof Player['stats']} statLabel={cat.statLabel} fixed={cat.fixed} />
                        }
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
