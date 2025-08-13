
"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppContext } from "@/context/app-context";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, MapPin, Trophy, PlusCircle, ArrowLeft, BarChart2 } from "lucide-react";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const teamSchema = z.object({
  name: z.string().min(2, "Team name is required."),
  playerIds: z.array(z.string()).min(5, "A team must have at least 5 players."),
});

type TeamFormValues = z.infer<typeof teamSchema>;

function PointsTable({ tournament }: { tournament: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Points Table</CardTitle>
                <CardDescription>Standings for the {tournament.format} stage.</CardDescription>
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
                        {/* Placeholder Data */}
                         {tournament.teams.map((team: any, index: number) => (
                             <TableRow key={team.id}>
                                 <TableCell>{index + 1}</TableCell>
                                 <TableCell className="font-medium">{team.name}</TableCell>
                                 <TableCell className="text-center">0</TableCell>
                                 <TableCell className="text-center">0</TableCell>
                                 <TableCell className="text-center">0</TableCell>
                                 <TableCell className="text-center">0</TableCell>
                                 <TableCell className="text-center font-bold">0</TableCell>
                                 <TableCell>+0.000</TableCell>
                             </TableRow>
                         ))}
                         {tournament.teams.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground">
                                    No teams have registered yet.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournaments, players, registerTeamForTournament } = useAppContext();
  const { toast } = useToast();

  const tournament = tournaments.find(t => t.id === id);

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

  return (
    <div className="space-y-8">
        <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments
            </Button>
            <h1 className="text-4xl font-bold tracking-tight">{tournament.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-muted-foreground">
                <span className="flex items-center gap-2"><Trophy /> {tournament.format}</span>
                <span className="flex items-center gap-2"><MapPin /> {tournament.venue}</span>
                <span className="flex items-center gap-2"><Calendar /> {new Date(tournament.dates.start).toLocaleDateString()} - {new Date(tournament.dates.end).toLocaleDateString()}</span>
            </div>
            {tournament.description && <p className="mt-4 text-muted-foreground max-w-2xl">{tournament.description}</p>}
        </div>

        <Tabs defaultValue="teams">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teams"><Users className="mr-2" />Teams & Registration</TabsTrigger>
                <TabsTrigger value="points"><BarChart2 className="mr-2"/>Points Table</TabsTrigger>
            </TabsList>
            <TabsContent value="teams">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                    <div className="lg:col-span-2 space-y-6">
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
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? 'Registering...' : 'Register Team'}
                                </Button>
                            </form>
                            </Form>
                        </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="points">
                 <div className="mt-6">
                    <PointsTable tournament={tournament} />
                 </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
