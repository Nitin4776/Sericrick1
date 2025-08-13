
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AdminGate } from "../admin-gate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { Player } from "@/lib/types";

const matchSchema = z.object({
  overs: z.coerce.number().min(1, "Overs must be at least 1."),
  venue: z.string().min(2, "Venue is required."),
  team1Name: z.string().min(2, "Team 1 name is required."),
  team2Name: z.string().min(2, "Team 2 name is required."),
  team1Players: z.array(z.string()).min(1, "Select at least one player for Team 1."),
  team2Players: z.array(z.string()).min(1, "Select at least one player for Team 2."),
});

type MatchFormValues = z.infer<typeof matchSchema>;

export function MatchForm() {
  const { players, scheduleMatch } = useAppContext();
  const { toast } = useToast();

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      overs: 8,
      venue: "",
      team1Name: "",
      team2Name: "",
      team1Players: [],
      team2Players: [],
    },
  });

  const team1SelectedPlayers = form.watch("team1Players");
  const team2SelectedPlayers = form.watch("team2Players");

  const onSubmit = (data: MatchFormValues) => {
    const team1PlayersList = players.filter(p => data.team1Players.includes(p.id as string));
    const team2PlayersList = players.filter(p => data.team2Players.includes(p.id as string));

    scheduleMatch({
      overs: data.overs,
      venue: data.venue,
      teams: [
        { name: data.team1Name, players: team1PlayersList as any, runs: 0, wickets: 0, overs: 0, inningCompleted: false },
        { name: data.team2Name, players: team2PlayersList as any, runs: 0, wickets: 0, overs: 0, inningCompleted: false },
      ],
    });
    
    toast({ title: "Match Scheduled", description: `${data.team1Name} vs ${data.team2Name} is scheduled.` });
    form.reset();
  };

  return (
    <AdminGate block={false} message="Admin access is required to schedule a new match.">
      <Card>
        <CardHeader>
          <CardTitle>Schedule New Match</CardTitle>
          <CardDescription>Only visible to admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="team1Name"
                  render={({ field }) => (
                    <FormItem><FormLabel>Team 1 Name</FormLabel><FormControl><Input placeholder="Team A" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="team2Name"
                  render={({ field }) => (
                    <FormItem><FormLabel>Team 2 Name</FormLabel><FormControl><Input placeholder="Team B" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="overs"
                  render={({ field }) => (
                    <FormItem><FormLabel>Overs</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="Main Ground" {...field} /></FormControl><FormMessage /></FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="team1Players"
                  render={() => (
                    <FormItem>
                      <FormLabel>Team 1 Players</FormLabel>
                      <ScrollArea className="h-48 w-full rounded-md border p-4">
                        {players.map((player: Player) => (
                            <FormField
                            key={player.id as string}
                            control={form.control}
                            name="team1Players"
                            render={({ field }) => (
                                <FormItem key={player.id as string} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(player.id as string)}
                                            disabled={team2SelectedPlayers?.includes(player.id as string)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...field.value, player.id as string])
                                                : field.onChange(field.value?.filter((value) => value !== player.id))
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
                 <FormField
                  control={form.control}
                  name="team2Players"
                  render={() => (
                    <FormItem>
                      <FormLabel>Team 2 Players</FormLabel>
                       <ScrollArea className="h-48 w-full rounded-md border p-4">
                        {players.map((player) => (
                           <FormField
                            key={player.id as string}
                            control={form.control}
                            name="team2Players"
                            render={({ field }) => (
                                <FormItem key={player.id as string} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(player.id as string)}
                                            disabled={team1SelectedPlayers?.includes(player.id as string)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...field.value, player.id as string])
                                                : field.onChange(field.value?.filter((value) => value !== player.id))
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
              </div>

              <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Scheduling..." : "Schedule Match"}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminGate>
  );
}
