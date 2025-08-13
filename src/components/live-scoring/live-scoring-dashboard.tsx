
"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { Match, Player } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, User, Shield, Info } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Label } from "../ui/label";

function PlayerSelector({ players, selectedPlayer, onSelect, otherSelectedPlayer, label, disabled = false, availablePlayers }: { players: Player[], selectedPlayer: Player | null, onSelect: (id: string) => void, otherSelectedPlayer?: Player | null, label: string, disabled?: boolean, availablePlayers?: Player[] }) {
    const playerList = availablePlayers || players;
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select onValueChange={onSelect} value={selectedPlayer?.id as string | undefined} disabled={disabled}>
                <SelectTrigger><SelectValue placeholder={`Select ${label}...`} /></SelectTrigger>
                <SelectContent>
                    {playerList.map(p => (
                        <SelectItem key={p.id as string} value={p.id as string} disabled={otherSelectedPlayer?.id === p.id}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

function PlayerSetup({ onConfirm }: { onConfirm: (strikerId: string, nonStrikerId: string, bowlerId: string) => void }) {
    const { liveMatch } = useAppContext();
    const [strikerId, setStrikerId] = useState<string>('');
    const [nonStrikerId, setNonStrikerId] = useState<string>('');
    const [bowlerId, setBowlerId] = useState<string>('');

    if (!liveMatch) return null;

    const currentInningData = liveMatch.scorecard?.[`inning${liveMatch.currentInning}` as 'inning1' | 'inning2'];
    const battingTeam = liveMatch.teams.find(t => t.name === currentInningData?.team);
    const bowlingTeam = liveMatch.teams.find(t => t.name !== currentInningData?.team);

    if (!battingTeam || !bowlingTeam) return null;
    
    const availableBatsmen = battingTeam.players.filter(p => !currentInningData.batsmen[p.id]?.out);
    
    return (
         <Card>
            <CardHeader><CardTitle>Set Players</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <PlayerSelector 
                    players={battingTeam.players}
                    availablePlayers={availableBatsmen} 
                    label="On-Strike Batsman" 
                    selectedPlayer={battingTeam.players.find(p => p.id === strikerId) || null} 
                    onSelect={setStrikerId} 
                    otherSelectedPlayer={battingTeam.players.find(p => p.id === nonStrikerId) || null}/>
                <PlayerSelector 
                    players={battingTeam.players}
                    availablePlayers={availableBatsmen} 
                    label="Non-Strike Batsman" 
                    selectedPlayer={battingTeam.players.find(p => p.id === nonStrikerId) || null} 
                    onSelect={setNonStrikerId} 
                    otherSelectedPlayer={battingTeam.players.find(p => p.id === strikerId) || null}/>
                <PlayerSelector 
                    players={bowlingTeam.players} 
                    label="Bowler" 
                    selectedPlayer={bowlingTeam.players.find(p => p.id === bowlerId) || null} 
                    onSelect={setBowlerId} />
                <Button onClick={() => onConfirm(strikerId, nonStrikerId, bowlerId)} disabled={!strikerId || !nonStrikerId || !bowlerId}>Confirm Players</Button>
            </CardContent>
        </Card>
    );
}

function NewBatsmanSelector({ onConfirm }: { onConfirm: (strikerId: string) => void }) {
    const { liveMatch } = useAppContext();
    const [newStrikerId, setNewStrikerId] = useState<string>('');

    if (!liveMatch) return null;
    
    const currentInningData = liveMatch.scorecard?.[`inning${liveMatch.currentInning}` as 'inning1' | 'inning2'];
    const battingTeam = liveMatch.teams.find(t => t.name === currentInningData?.team);

    if (!battingTeam) return null;

    const availableBatsmen = battingTeam.players.filter(p => !currentInningData.batsmen[p.id]?.out && p.id !== liveMatch.currentBatsmen.nonStriker?.id);

    return (
        <Card>
            <CardHeader><CardTitle>Wicket! Select New Batsman</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <PlayerSelector 
                    players={battingTeam.players} 
                    availablePlayers={availableBatsmen}
                    label="New Batsman" 
                    selectedPlayer={battingTeam.players.find(p => p.id === newStrikerId) || null} 
                    onSelect={setNewStrikerId}
                    otherSelectedPlayer={liveMatch.currentBatsmen.nonStriker}
                />
                <Button onClick={() => onConfirm(newStrikerId)} disabled={!newStrikerId}>Confirm Batsman</Button>
            </CardContent>
        </Card>
    )
}

function NewBowlerSelector({ onConfirm }: { onConfirm: (bowlerId: string) => void }) {
    const { liveMatch } = useAppContext();
    const [newBowlerId, setNewBowlerId] = useState('');

    if (!liveMatch) return null;
    
    const currentInningData = liveMatch.scorecard?.[`inning${liveMatch.currentInning}` as 'inning1' | 'inning2'];
    const bowlingTeam = liveMatch.teams.find(t => t.name !== currentInningData?.team);
    
    if (!bowlingTeam) return null;

    return (
        <Card>
            <CardHeader><CardTitle>End of Over! Select New Bowler</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <PlayerSelector 
                    players={bowlingTeam.players} 
                    label="New Bowler" 
                    selectedPlayer={bowlingTeam.players.find(p => p.id === newBowlerId) || null} 
                    onSelect={setNewBowlerId}
                />
                <Button onClick={() => onConfirm(newBowlerId)} disabled={!newBowlerId}>Confirm Bowler</Button>
            </CardContent>
        </Card>
    )
}


export function LiveScoringDashboard() {
  const { matches, liveMatch, startScoringMatch, performToss, selectTossOption, scoreRun, scoreWicket, scoreExtra, endMatch, setLivePlayers, players } = useAppContext();
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStart = () => {
    if (selectedMatchId) {
      startScoringMatch(selectedMatchId);
    }
  };
  
  const handleSetInitialPlayers = (strikerId: string, nonStrikerId: string, bowlerId: string) => {
    setLivePlayers(strikerId, nonStrikerId, bowlerId);
  };
  
  const handleSetNewBatsman = (strikerId: string) => {
    if (liveMatch?.currentBatsmen.nonStriker && liveMatch?.currentBowler) {
      setLivePlayers(strikerId, liveMatch.currentBatsmen.nonStriker.id as string, liveMatch.currentBowler.id as string);
    }
  };

  const handleSetNewBowler = (bowlerId: string) => {
    if (liveMatch?.currentBatsmen.striker && liveMatch?.currentBatsmen.nonStriker) {
      setLivePlayers(liveMatch.currentBatsmen.striker.id as string, liveMatch.currentBatsmen.nonStriker.id as string, bowlerId);
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
  
  const currentInningData = liveMatch.scorecard?.[`inning${liveMatch.currentInning}` as 'inning1' | 'inning2'];
  const battingTeam = liveMatch.teams.find(t => t.name === currentInningData?.team);
  const bowlingTeam = liveMatch.teams.find(t => t.name !== currentInningData?.team);
  const arePlayersSet = liveMatch.currentBatsmen.striker && liveMatch.currentBatsmen.nonStriker && liveMatch.currentBowler;
  const isWicketFallen = liveMatch.currentBatsmen.striker === null && liveMatch.currentBatsmen.nonStriker !== null;
  const isOverFinished = liveMatch.currentBowler === null && liveMatch.ballsInOver === 0 && liveMatch.currentOver > 0;
  
  const isSecondInningStarting = liveMatch.currentInning === 2 && !arePlayersSet;
  const isFirstInningStarting = liveMatch.currentInning === 1 && liveMatch.scorecard?.inning1.team && !arePlayersSet;


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
                    <p className="text-sm text-muted-foreground">Overs: {liveMatch.teams[0].overs.toFixed(1)}</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-lg">{liveMatch.teams[1].name}</h4>
                    <p className="text-3xl font-bold">{liveMatch.teams[1].runs} / {liveMatch.teams[1].wickets}</p>
                    <p className="text-sm text-muted-foreground">Overs: {liveMatch.teams[1].overs.toFixed(1)}</p>
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
        ) : (isFirstInningStarting || isSecondInningStarting) ? (
            <PlayerSetup onConfirm={handleSetInitialPlayers} />
        ) : isWicketFallen ? (
            <NewBatsmanSelector onConfirm={handleSetNewBatsman} />
        ) : isOverFinished ? (
            <NewBowlerSelector onConfirm={handleSetNewBowler} />
        ) : arePlayersSet ? (
            <Card>
                <CardHeader>
                    <CardTitle>Ball-by-Ball Scoring</CardTitle>
                    <CardDescription>
                       <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                           <span className="flex items-center"><User className="mr-1 h-4 w-4 text-primary"/>Striker: {liveMatch.currentBatsmen.striker?.name}</span>
                           <span className="flex items-center"><User className="mr-1 h-4 w-4 text-muted-foreground"/>Non-Striker: {liveMatch.currentBatsmen.nonStriker?.name}</span>
                           <span className="flex items-center"><Shield className="mr-1 h-4 w-4 text-primary"/>Bowler: {liveMatch.currentBowler?.name}</span>
                       </div>
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
                        <Button variant="outline" onClick={() => scoreRun(1, true)}>Declare 1 Run</Button>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Action Required</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please set the players for the current phase of the match.</p>
                </CardContent>
            </Card>
        )}
        <Button variant="link" onClick={endMatch}>End & Finalize Match</Button>
    </div>
  );
}
