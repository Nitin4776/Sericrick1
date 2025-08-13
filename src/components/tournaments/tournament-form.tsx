
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AdminGate } from "../admin-gate";
import type { TournamentFormat } from "@/lib/types";

const tournamentSchema = z.object({
  name: z.string().min(3, "Tournament name is required."),
  venue: z.string().min(3, "Venue is required."),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional(),
  format: z.enum(["Series (2 Teams)", "Round Robin", "Group Stage + Knockout", "Knockout", "League Table"]),
  numberOfMatches: z.coerce.number().optional(),
}).refine(data => {
    if (data.format === "Series (2 Teams)") {
        return data.numberOfMatches && data.numberOfMatches > 0;
    }
    return true;
}, {
    message: "Number of matches is required for a series.",
    path: ["numberOfMatches"],
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

const formats: TournamentFormat[] = [
    "Series (2 Teams)",
    "Round Robin",
    "Group Stage + Knockout",
    "Knockout",
    "League Table",
];

export function TournamentForm() {
  const { scheduleTournament } = useAppContext();
  const { toast } = useToast();

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      venue: "",
      startDate: "",
      endDate: "",
      description: "",
      format: "Knockout",
      numberOfMatches: undefined,
    },
  });

  const selectedFormat = form.watch("format");

  const onSubmit = (data: TournamentFormValues) => {
    scheduleTournament({
      name: data.name,
      venue: data.venue,
      dates: { start: data.startDate, end: data.endDate },
      description: data.description || "",
      format: data.format,
      numberOfMatches: data.numberOfMatches,
    });
    toast({ title: "Tournament Scheduled", description: `"${data.name}" has been successfully scheduled.` });
    form.reset();
  };

  return (
    <AdminGate block={false} message="Admin access is required to schedule a new tournament.">
      <Card>
        <CardHeader>
          <CardTitle>Schedule New Tournament</CardTitle>
          <CardDescription>Only visible to admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Summer Cup 2024" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl><Input placeholder="e.g. City Stadium" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {formats.map(format => (
                                <SelectItem key={format} value={format}>{format}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {selectedFormat === 'Series (2 Teams)' && (
                    <FormField
                    control={form.control}
                    name="numberOfMatches"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Matches</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g. 3" {...field} value={field.value ?? ''} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="A brief description of the tournament" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Scheduling...' : 'Schedule Tournament'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminGate>
  );
}
