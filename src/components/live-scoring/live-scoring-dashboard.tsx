
"use client";

import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { Match, Player, ScorecardInning } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, User, Shield, Info, ArrowLeft, BarChart, Users, Trophy } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function PlayerSelectionCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

function PlayerSelector({ players, selectedPlayer, onSelect, otherSelectedPlayer, label, disabled = false, availablePlayers, scorecard }: { players: Player[], selectedPlayer: Player | null, onSelect: (id: string) => void, otherSelectedPlayer?: Player | null, label: string, disabled?: boolean, availablePlayers?: Player[], scorecard?: ScorecardInning }) {
    const playerList = availablePlayers || players;

    const getBowlerOvers = (playerId: string) => {
        if (!scorecard || !scorecard.bowlers[playerId]) {
            return "0.0";
        }
        const overs = scorecard.bowlers[playerId].overs || 0;
        return overs.toFixed(1);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select onValueChange={onSelect} value={selectedPlayer?.id as string | undefined} disabled={disabled}>
                <SelectTrigger><SelectValue placeholder={`Select ${label}...`} /></SelectTrigger>
                <SelectContent>
                    {playerList.map(p => (
                        <SelectItem key={p.id as string} value={p.id as string} disabled={otherSelectedPlayer?.id === p.id}>
                            {p.name} {label === "Bowler" && `(${getBowlerOvers(p.id as string)} ov)`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
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
        <PlayerSelectionCard title="Set Players for Inning">
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
                onSelect={setBowlerId}
                scorecard={currentInningData}
                 />
            <Button onClick={() => onConfirm(strikerId, nonStrikerId, bowlerId)} disabled={!strikerId || !nonStrikerId || !bowlerId}>Confirm Players</Button>
        </PlayerSelectionCard>
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
        <PlayerSelectionCard title="Wicket! Select New Batsman">
             <PlayerSelector 
                players={battingTeam.players} 
                availablePlayers={availableBatsmen}
                label="New Batsman" 
                selectedPlayer={battingTeam.players.find(p => p.id === newStrikerId) || null} 
                onSelect={setNewStrikerId}
                otherSelectedPlayer={liveMatch.currentBatsmen.nonStriker}
            />
            <Button onClick={() => onConfirm(newStrikerId)} disabled={!newStrikerId}>Confirm Batsman</Button>
        </PlayerSelectionCard>
    );
}

function NewBowlerSelector({ onConfirm }: { onConfirm: (bowlerId: string) => void }) {
    const { liveMatch } = useAppContext();
    const [newBowlerId, setNewBowlerId] = useState('');

    if (!liveMatch) return null;
    
    const currentInningData = liveMatch.scorecard?.[`inning${liveMatch.currentInning}` as 'inning1' | 'inning2'];
    const bowlingTeam = liveMatch.teams.find(t => t.name !== currentInningData?.team);
    
    if (!bowlingTeam) return null;

    const availableBowlers = bowlingTeam.players.filter(p => p.id !== liveMatch.previousBowlerId);

    return (
        <PlayerSelectionCard title="End of Over! Select New Bowler">
             <PlayerSelector 
                players={bowlingTeam.players}
                availablePlayers={availableBowlers}
                label="Bowler" 
                selectedPlayer={bowlingTeam.players.find(p => p.id === newBowlerId) || null} 
                onSelect={setNewBowlerId}
                scorecard={currentInningData}
            />
            <Button onClick={() => onConfirm(newBowlerId)} disabled={!newBowlerId}>Confirm Bowler</Button>
        </PlayerSelectionCard>
    );
}

function LiveScorecard() {
    const { liveMatch, players } = useAppContext();

    if (!liveMatch || !liveMatch.scorecard) return null;

    const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown Player';

    const renderInning = (inningData: ScorecardInning, inningNum: number) => {
        if (!inningData || !inningData.team) return null;

        const batsmen = Object.values(inningData.batsmen).sort((a,b) => (a.balls > 0 || a.runs > 0) ? -1 : 1);
        const bowlers = Object.values(inningData.bowlers);

        return (
            <TabsContent value={`inning${inningNum}`}>
                <Card>
                    <CardHeader>
                        <CardTitle>{inningData.team} Innings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Users />Batting</h4>
                             <Table>
                                <TableHeader><TableRow><TableHead>Batsman</TableHead><TableHead>R</TableHead><TableHead>B</TableHead><TableHead>4s</TableHead><TableHead>6s</TableHead><TableHead>SR</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {batsmen.map(b => (
                                        <TableRow key={b.playerId}>
                                            <TableCell>{getPlayerName(b.playerId)}{b.out && <span className="text-destructive text-xs ml-2">out</span>}</TableCell>
                                            <TableCell>{b.runs}</TableCell>
                                            <TableCell>{b.balls}</TableCell>
                                            <TableCell>{b.fours}</TableCell>
                                            <TableCell>{b.sixes}</TableCell>
                                            <TableCell>{(b.balls > 0 ? (b.runs / b.balls * 100) : 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Shield />Bowling</h4>
                             <Table>
                                <TableHeader><TableRow><TableHead>Bowler</TableHead><TableHead>O</TableHead><TableHead>R</TableHead><TableHead>W</TableHead><TableHead>Econ</TableHead></TableRow></TableHeader>
                                <TableBody>
                                     {bowlers.map(b => (
                                        <TableRow key={b.playerId}>
                                            <TableCell>{getPlayerName(b.playerId)}</TableCell>
                                            <TableCell>{(b.overs || 0).toFixed(1)}</TableCell>
                                            <TableCell>{b.runs}</TableCell>
                                            <TableCell>{b.wickets}</TableCell>
                                            <TableCell>{(b.overs > 0 ? b.runs / b.overs : 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        )
    }

    return (
        <Tabs defaultValue="inning1" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inning1" disabled={!liveMatch.scorecard?.inning1.team}>
                    {liveMatch.scorecard?.inning1.team || "Inning 1"}
                </TabsTrigger>
                 <TabsTrigger value="inning2" disabled={!liveMatch.scorecard?.inning2.team}>
                    {liveMatch.scorecard?.inning2.team || "Inning 2"}
                </TabsTrigger>
            </TabsList>
            {renderInning(liveMatch.scorecard!.inning1, 1)}
            {renderInning(liveMatch.scorecard!.inning2, 2)}
        </Tabs>
    )
}

function EndMatchDialog({ open, onOpenChange, onConfirm }: { open: boolean, onOpenChange: (open: boolean) => void, onConfirm: (reason: string) => void }) {
    const [reason, setReason] = useState("Match Forfeited");

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>End Match Early?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will finalize the match. Please select a reason for ending the match before its natural conclusion. This will be recorded as the official result.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <RadioGroup defaultValue={reason} onValueChange={setReason} className="my-4 space-y-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Match Forfeited" id="r1" />
                        <Label htmlFor="r1">Match Forfeited</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Bad Weather" id="r2" />
                        <Label htmlFor="r2">Bad Weather / Poor Conditions</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Match Abandoned" id="r3" />
                        <Label htmlFor="r3">Match Abandoned (Other)</Label>
                    </div>
                </RadioGroup>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm(reason)}>Confirm & End Match</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function MatchCompletedDialog({ open, onOpenChange, result }: { open: boolean, onOpenChange: (open: boolean) => void, result: string | null }) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center">
                <Trophy className="h-16 w-16 text-yellow-500" />
            </div>
            <AlertDialogTitle className="text-center text-2xl">Match Finished!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg">
              {result}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => onOpenChange(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
}


export function LiveScoringDashboard() {
  const { matches, liveMatch, startScoringMatch, performToss, selectTossOption, scoreRun, scoreWicket, scoreExtra, endMatch, setLivePlayers, players, leaveLiveMatch } = useAppContext();
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [isEndMatchDialogOpen, setIsEndMatchDialogOpen] = useState(false);
  const [isMatchCompletedDialogOpen, setMatchCompletedDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (liveMatch?.status === 'completed') {
        setMatchCompletedDialogOpen(true);
    }
  }, [liveMatch?.status]);

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
  
  const handleEndMatchConfirm = (reason: string) => {
    endMatch(reason);
    setIsEndMatchDialogOpen(false);
  }

  const scheduledMatches = matches.filter(m => m.status === 'scheduled');

  if (!isClient) {
    return (
        <Card className="max-w-4xl mx-auto">
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
                    <SelectItem key={match.id} value={match.id}>
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
  
  const arePlayersSet = liveMatch.currentBatsmen.striker && liveMatch.currentBatsmen.nonStriker && liveMatch.currentBowler;
  const isWicketFallen = liveMatch.currentBatsmen.striker === null && liveMatch.currentBatsmen.nonStriker !== null;
  const isOverFinished = liveMatch.ballsInOver === 0 && liveMatch.currentOver > 0 && liveMatch.currentBowler === null;
  
  const inningStarted = !!currentInningData?.team;
  const isMatchStarting = !inningStarted;
  const isInningStarting = inningStarted && !arePlayersSet && !isWicketFallen && !isOverFinished;
  const overEvents = liveMatch.overEvents || [];

  const renderContent = () => {
    if (liveMatch.status === 'completed') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary"><Info className="h-5 w-5" />Match Over</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert className="border-primary">
                        <AlertTitle className="font-bold">Match Finished!</AlertTitle>
                        <AlertDescription>{liveMatch.result}</AlertDescription>
                    </Alert>
                    <Button onClick={leaveLiveMatch} className="mt-4">Back to Match List</Button>
                </CardContent>
            </Card>
        );
    }
    
    if (isMatchStarting) {
       return (
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
       );
    }

    if (isInningStarting) {
        return <PlayerSetup onConfirm={handleSetInitialPlayers} />;
    }

    if (isWicketFallen) {
        return <NewBatsmanSelector onConfirm={handleSetNewBatsman} />;
    }

    if (isOverFinished) {
        return <NewBowlerSelector onConfirm={handleSetNewBowler} />;
    }

    if (arePlayersSet) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ball-by-Ball Scoring</CardTitle>
                    <CardDescription>
                       <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-2 text-sm mt-2">
                           <span className="flex items-center"><User className="mr-1 h-4 w-4 text-primary"/>Striker: <strong>{liveMatch.currentBatsmen.striker?.name}</strong></span>
                           <span className="flex items-center"><User className="mr-1 h-4 w-4 text-muted-foreground"/>Non-Striker: <strong>{liveMatch.currentBatsmen.nonStriker?.name}</strong></span>
                           <span className="flex items-center"><Shield className="mr-1 h-4 w-4 text-primary"/>Bowler: <strong>{liveMatch.currentBowler?.name}</strong></span>
                       </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>This Over</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {overEvents.length > 0 ? overEvents.map((event, i) => (
                                <Badge key={i} variant={event === 'W' ? 'destructive' : 'secondary'} className="text-lg">{event}</Badge>
                            )) : <p className="text-sm text-muted-foreground">First ball of the over.</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Score Runs</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => scoreRun(0)}>0</Button>
                            <Button variant="outline" onClick={() => scoreRun(1)}>1</Button>
                            <Button variant="outline" onClick={() => scoreRun(2)}>2</Button>
                            <Button variant="outline" onClick={() => scoreRun(3)}>3</Button>
                            <Button variant="default" onClick={() => scoreRun(4)}>4</Button>
                            <Button variant="default" onClick={() => scoreRun(6)}>6</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Events</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="destructive" onClick={scoreWicket}>Wicket</Button>
                            <Button variant="secondary" onClick={() => scoreExtra('Wide')}>Wide</Button>
                            <Button variant="secondary" onClick={() => scoreExtra('No Ball')}>No Ball</Button>
                            <Button variant="outline" onClick={() => scoreRun(1, true)}>Declare 1 Run</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Action Required</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The system is waiting for the next action.</p>
            </CardContent>
        </Card>
    );
  }

  const getTeamScore = (teamName: string | null | undefined) => {
    if (!liveMatch?.teams || !teamName) return { runs: 0, wickets: 0, overs: '0.0' };
    const teamData = liveMatch.teams.find(t => t.name === teamName);
    return {
      runs: teamData?.runs ?? 0,
      wickets: teamData?.wickets ?? 0,
      overs: teamData?.overs?.toFixed(1) ?? '0.0',
    };
  };

  const inning1Score = getTeamScore(liveMatch.scorecard?.inning1.team);
  const inning2Score = getTeamScore(liveMatch.scorecard?.inning2.team);


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Live Match: {liveMatch.teams[0].name} vs {liveMatch.teams[1].name}</CardTitle>
                        <CardDescription>{liveMatch.venue}, {liveMatch.overs} Overs</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={leaveLiveMatch}><ArrowLeft className="mr-2"/> Back to Match List</Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-lg">{liveMatch.scorecard?.inning1.team || 'Inning 1'}</h4>
                    <p className="text-3xl font-bold">{inning1Score.runs} / {inning1Score.wickets}</p>
                    <p className="text-sm text-muted-foreground">Overs: {inning1Score.overs}</p>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-lg">{liveMatch.scorecard?.inning2.team || 'Inning 2'}</h4>
                    <p className="text-3xl font-bold">{inning2Score.runs} / {inning2Score.wickets}</p>
                    <p className="text-sm text-muted-foreground">Overs: {inning2Score.overs}</p>
                </div>
            </CardContent>
             {liveMatch.result && (
                <CardContent>
                    <Alert className="border-primary">
                        <AlertTitle className="font-bold">Match Result</AlertTitle>
                        <AlertDescription>{liveMatch.result}</AlertDescription>
                    </Alert>
                </CardContent>
            )}
             <CardFooter>
                 {liveMatch.status !== 'completed' && <Button variant="link" onClick={() => setIsEndMatchDialogOpen(true)}>End & Finalize Match</Button>}
            </CardFooter>
        </Card>

        {renderContent()}
        
        {currentInningData?.team && <LiveScorecard />}

        <EndMatchDialog 
            open={isEndMatchDialogOpen} 
            onOpenChange={setIsEndMatchDialogOpen} 
            onConfirm={handleEndMatchConfirm} 
        />
        <MatchCompletedDialog 
            open={isMatchCompletedDialogOpen}
            onOpenChange={setMatchCompletedDialogOpen}
            result={liveMatch.result}
        />
    </div>
  );
}
