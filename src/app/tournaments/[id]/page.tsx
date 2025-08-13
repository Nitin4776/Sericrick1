
"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppContext } from "@/context/app-context";
import type { Player, Match, PointsTableEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, MapPin, Trophy, PlusCircle, ArrowLeft, BarChart2, Play, StopCircle, Swords, Award } from "lucide-react";
import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


const createTeamSchema = (playersPerTeam: number) => z.object({
  name: z.string().min(2, "Team name is required."),
  playerIds: z.array(z.string()).length(playersPerTeam, `You must select exactly ${playersPerTeam} players.`),
});


type TeamFormValues = z.infer<ReturnType<typeof createTeamSchema>>;

function PointsTable({ tournament, pointsTable }: { tournament: any, pointsTable: PointsTableEntry[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Points Table</CardTitle>
                <CardDescription>Standings for the {tournament.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pos</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead className="text-center">Pld</TableHead>
                            <TableHead className="text-center">Won</TableHead>
                            <TableHead className="text-center">Lost</TableHead>
                            <TableHead className="text-center">NR</TableHead>
                            <TableHead className="text-center">Points</TableHead>
                            <TableHead>NRR</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {pointsTable.map((entry: PointsTableEntry, index: number) => (
                             <TableRow key={entry.teamName}>
                                 <TableCell>{index + 1}</TableCell>
                                 <TableCell className="font-medium">{entry.teamName}</TableCell>
                                 <TableCell className="text-center">{entry.played}</TableCell>
                                 <TableCell className="text-center">{entry.won}</TableCell>
                                 <TableCell className="text-center">{entry.lost}</TableCell>
                                 <TableCell className="text-center">{entry.noResult}</TableCell>
                                 <TableCell className="text-center font-bold">{entry.points}</TableCell>
                                 <TableCell>{entry.nrr.toFixed(3)}</TableCell>
                             </TableRow>
                         ))}
                         {pointsTable.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground">
                                    No matches have been completed yet.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function TournamentResult({ tournament, pointsTable, allPlayers }: { tournament: any, pointsTable: PointsTableEntry[], allPlayers: Player[] }) {
    if (tournament.status !== 'completed' || pointsTable.length === 0) {
        return null;
    }

    const winner = pointsTable[0];
    // A simple way to determine player of the tournament
    const tournamentMatches = tournament.scheduledMatches || [];
    const playerStats: { [playerId: string]: { runs: number, wickets: number, name: string } } = {};

    allPlayers.forEach(p => {
        playerStats[p.id] = { runs: 0, wickets: 0, name: p.name };
    });

    matches.filter(m => tournamentMatches.includes(m.id)).forEach(m => {
        if(m.scorecard) {
            Object.values(m.scorecard.inning1.batsmen).forEach(b => {
                if(playerStats[b.playerId]) playerStats[b.playerId].runs += b.runs;
            });
             Object.values(m.scorecard.inning1.bowlers).forEach(b => {
                if(playerStats[b.playerId]) playerStats[b.playerId].wickets += b.wickets;
            });
             Object.values(m.scorecard.inning2.batsmen).forEach(b => {
                if(playerStats[b.playerId]) playerStats[b.playerId].runs += b.runs;
            });
             Object.values(m.scorecard.inning2.bowlers).forEach(b => {
                if(playerStats[b.playerId]) playerStats[b.playerId].wickets += b.wickets;
            });
        }
    });

    const playerOfTheTournament = Object.values(playerStats).sort((a, b) => (b.runs + b.wickets * 20) - (a.runs + a.wickets * 20))[0];

    return (
        <Card className="border-primary">
            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2"><Trophy/> Tournament Finished!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <p className="text-muted-foreground">Winner</p>
                    <p className="text-3xl font-bold">{winner.teamName}</p>
                </div>
                <div className="text-center">
                    <p className="text-muted-foreground">Player of the Tournament</p>
                    <p className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Award className="text-amber-500" /> 
                        {playerOfTheTournament.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {playerOfTheTournament.runs} Runs & {playerOfTheTournament.wickets} Wickets
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

function ScheduledMatches({ tournament, allMatches }: { tournament: any, allMatches: Match[] }) {
    const tournamentMatches = allMatches.filter(m => m.tournamentId === tournament.id);

    if (tournament.status === 'scheduled') {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Swords />Scheduled Matches</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Matches will appear here once the tournament starts.</p>
                </CardContent>
            </Card>
        )
    }

    if (tournamentMatches.length === 0) {
        return (
            <Card>
               <CardHeader>
                   <CardTitle className="flex items-center gap-2"><Swords />Scheduled Matches</CardTitle>
               </CardHeader>
               <CardContent>
                   <p className="text-muted-foreground">No matches have been scheduled for this tournament yet.</p>
               </CardContent>
           </Card>
       )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Swords />Scheduled Matches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {tournamentMatches.map(match => (
                    <div key={match.id} className="p-3 bg-muted/50 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{match.teams[0].name} vs {match.teams[1].name}</p>
                            <p className="text-sm text-muted-foreground">{match.venue}</p>
                        </div>
                        <Badge variant={match.status === 'completed' ? 'secondary' : 'default'}>{match.status}</Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, players, matches, registerTeamForTournament, isAdmin, startTournament, closeTournament, calculatePointsTable } = useAppContext();
  const { toast } = useToast();

  const tournament = tournaments.find(t => t.id === id);

  const teamSchema = React.useMemo(() => {
    return createTeamSchema(tournament?.playersPerTeam || 5);
  }, [tournament?.playersPerTeam]);

  const pointsTable = useMemo(() => {
    if (!tournament) return [];
    return calculatePointsTable(tournament);
  }, [tournament, matches, calculatePointsTable]);


  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      playerIds: [],
    },
  });

  const onSubmit = async (data: TeamFormValues) => {
    if (!tournament) return;
    const success = await registerTeamForTournament(tournament.id as string, data);
    if(success) {
        toast({ title: "Team Registered!", description: `${data.name} has been registered for ${tournament.name}.` });
        form.reset();
    }
  };
  
  const handleStartTournament = async () => {
    if(!tournament) return;
    await startTournament(tournament.id as string);
  }

  const handleCloseTournament = async () => {
    if(!tournament) return;
    await closeTournament(tournament.id as string);
  }

  const registeredPlayerIds = React.useMemo(() => {
    if (!tournament) return new Set();
    const allPlayerIds = tournament.teams.flatMap(team => team.playerIds);
    return new Set(allPlayerIds);
  }, [tournament]);
  
  if (!tournament) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-8 w-full" />
            <Card>
                <CardHeader><Skeleton className="h-8 w-32" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown Player';

  const allMatchesCompleted = tournament.scheduledMatches && tournament.scheduledMatches.length > 0 && tournament.scheduledMatches.every(matchId => {
      const match = matches.find(m => m.id === matchId);
      return match && match.status === 'completed';
  });

  return (
    <div className="space-y-8">
        <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments
            </Button>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">{tournament.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-2"><Trophy /> {tournament.format}</span>
                        <span className="flex items-center gap-2"><Users /> {tournament.playersPerTeam} players/team</span>
                        <span className="flex items-center gap-2"><MapPin /> {tournament.venue}</span>
                        <span className="flex items-center gap-2"><Calendar /> {new Date(tournament.dates.start).toLocaleDateString()} - {new Date(tournament.dates.end).toLocaleDateString()}</span>
                        <Badge variant={tournament.status === 'completed' ? 'secondary' : 'default'} className="capitalize">{tournament.status}</Badge>
                    </div>
                    {tournament.description && <p className="mt-4 text-muted-foreground max-w-2xl">{tournament.description}</p>}
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        {tournament.status === 'scheduled' && (
                            <Button onClick={handleStartTournament}>
                                <Play className="mr-2 h-4 w-4"/> Start Tournament
                            </Button>
                        )}
                        {tournament.status === 'ongoing' && allMatchesCompleted && (
                             <Button onClick={handleCloseTournament}>
                                <StopCircle className="mr-2 h-4 w-4"/> Close Tournament
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>

        <Tabs defaultValue="teams">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="teams"><Users className="mr-2" />Teams & Registration</TabsTrigger>
                <TabsTrigger value="matches"><Swords className="mr-2" />Matches</TabsTrigger>
                <TabsTrigger value="points"><BarChart2 className="mr-2"/>Points Table</TabsTrigger>
            </TabsList>
            <TabsContent value="teams">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                    <div className="lg:col-span-2 space-y-6">
                        <TournamentResult tournament={tournament} pointsTable={pointsTable} allPlayers={players} />
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users /> Registered Teams ({tournament.teams.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tournament.teams.length === 0 ? (
                                    <p className="text-muted-foreground">No teams have registered yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                    {tournament.teams.map(team => (
                                        <Card key={team.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{team.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="font-semibold mb-2 text-sm">Players:</p>
                                                <ul className="list-disc list-inside text-sm text-muted-foreground grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
                                                    {team.playerIds.map(playerId => <li key={playerId}>{getPlayerName(playerId)}</li>)}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><PlusCircle /> Register Your Team</CardTitle>
                            <CardDescription>Assemble your squad and join the tournament.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Team Name</FormLabel>
                                    <FormControl><Input placeholder="Your Team Name" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="playerIds"
                                render={() => (
                                    <FormItem>
                                    <FormLabel>Select Players</FormLabel>
                                    <ScrollArea className="h-60 w-full rounded-md border p-4">
                                        {players.map((player: Player) => (
                                        <FormField
                                            key={player.id as string}
                                            control={form.control}
                                            name="playerIds"
                                            render={({ field }) => (
                                            <FormItem key={player.id as string} className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(player.id as string)}
                                                    disabled={registeredPlayerIds.has(player.id as string)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...field.value, player.id as string])
                                                        : field.onChange(field.value?.filter((value) => value !== player.id));
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">{player.name}</FormLabel>
                                            </FormItem>
                                            )}
                                        />
                                        ))}
                                    </ScrollArea>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || tournament.status !== 'scheduled'}>
                                    {tournament.status !== 'scheduled' ? 'Registration Closed' : form.formState.isSubmitting ? 'Registering...' : 'Register Team'}
                                </Button>
                            </form>
                            </Form>
                        </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="matches">
                <div className="mt-6">
                    <ScheduledMatches tournament={tournament} allMatches={matches} />
                </div>
            </TabsContent>
            <TabsContent value="points">
                 <div className="mt-6">
                    <PointsTable tournament={tournament} pointsTable={pointsTable} />
                 </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
