"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function LiveScoringDashboard() {
  const { matches, liveMatch, startScoringMatch, performToss, selectTossOption, scoreRun, scoreWicket, scoreExtra, endMatch } = useAppContext();
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (liveMatch) {
      setSelectedMatchId(liveMatch.id.toString());
    }
  }, [liveMatch]);

  const handleStart = () => {
    if (selectedMatchId) {
      startScoringMatch(selectedMatchId);
    }
  };
  
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');

  if (!isClient) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    );
  }

  if (!liveMatch) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Start Live Scoring</CardTitle>
          <CardDescription>Select a scheduled match to begin live scoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Select onValueChange={setSelectedMatchId} value={selectedMatchId}>
                <SelectTrigger><SelectValue placeholder="Select a match..." /></SelectTrigger>
                <SelectContent>
                {scheduledMatches.map(match => (
                    <SelectItem key={match.id as string} value={match.id.toString()}>
                    {match.teams[0].name} vs {match.teams[1].name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Button onClick={handleStart} disabled={!selectedMatchId}>Start Scoring</Button>
            {scheduledMatches.length === 0 && <p className="text-sm text-muted-foreground">No scheduled matches available.</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Live Match: {liveMatch.teams[0].name} vs {liveMatch.teams[1].name}</CardTitle>
                <CardDescription>{liveMatch.venue}, {liveMatch.overs} Overs</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-lg">{liveMatch.teams[0].name}</h4>
                    <p className="text-3xl font-bold">{liveMatch.teams[0].runs} / {liveMatch.teams[0].wickets}</p>
                    <p className="text-sm text-muted-foreground">Overs: {typeof liveMatch.teams[0].overs === 'number' ? liveMatch.teams[0].overs.toFixed(1) : '0.0'}</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-lg">{liveMatch.teams[1].name}</h4>
                    <p className="text-3xl font-bold">{liveMatch.teams[1].runs} / {liveMatch.teams[1].wickets}</p>
                    <p className="text-sm text-muted-foreground">Overs: {typeof liveMatch.teams[1].overs === 'number' ? liveMatch.teams[1].overs.toFixed(1) : '0.0'}</p>
                </div>
            </CardContent>
        </Card>

        {!liveMatch.scorecard?.inning1.team ? (
            <Card>
                <CardHeader><CardTitle>Toss</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {liveMatch.tossWinner === undefined ? (
                         <Button onClick={performToss}><Coins className="mr-2 h-4 w-4" />Perform Toss</Button>
                    ): (
                        <div>
                            <Alert>
                                <AlertTitle>{liveMatch.teams[liveMatch.tossWinner].name} won the toss!</AlertTitle>
                                <AlertDescription>Choose to bat or bowl.</AlertDescription>
                            </Alert>
                            <div className="mt-4 space-x-2">
                                <Button onClick={() => selectTossOption('Bat')}>Bat</Button>
                                <Button onClick={() => selectTossOption('Bowl')} variant="outline">Bowl</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>Ball-by-Ball Scoring</CardTitle>
                    <CardDescription>
                       Current Batsman: {liveMatch.currentBatsmen.striker?.name} | Bowler: {liveMatch.currentBowler?.name}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => scoreRun(0)}>0</Button>
                        <Button variant="outline" onClick={() => scoreRun(1)}>1</Button>
                        <Button variant="outline" onClick={() => scoreRun(2)}>2</Button>
                        <Button variant="outline" onClick={() => scoreRun(3)}>3</Button>
                        <Button variant="default" onClick={() => scoreRun(4)}>4</Button>
                        <Button variant="default" onClick={() => scoreRun(6)}>6</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" onClick={scoreWicket}>Wicket</Button>
                        <Button variant="secondary" onClick={() => scoreExtra('Wide')}>Wide</Button>
                        <Button variant="secondary" onClick={() => scoreExtra('No Ball')}>No Ball</Button>
                    </div>
                </CardContent>
            </Card>
        )}
        <Button variant="link" onClick={endMatch}>End & Finalize Match</Button>
    </div>
  );
}
