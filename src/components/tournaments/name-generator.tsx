"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { generateTeamTournamentName } from "@/ai/flows/team-tournament-name-generator";
import type { GenerateTeamTournamentNameOutput } from "@/ai/flows/team-tournament-name-generator";
import { Wand2, Copy, Check } from "lucide-react";

const generatorSchema = z.object({
  type: z.enum(["team", "tournament"]),
  keywords: z.string().min(3, "Please provide some keywords."),
});

type GeneratorFormValues = z.infer<typeof generatorSchema>;

export function NameGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateTeamTournamentNameOutput | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorSchema),
    defaultValues: { type: "tournament", keywords: "" },
  });

  const onSubmit = async (data: GeneratorFormValues) => {
    setLoading(true);
    setResult(null);
    try {
      const output = await generateTeamTournamentName(data);
      setResult(output);
    } catch (error) {
      console.error("Error generating name:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="text-primary" />
          <span>AI Name Generator</span>
        </CardTitle>
        <CardDescription>Get creative names for your teams and tournaments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl><Input placeholder="e.g. Pune, Summer, Champions" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Name"}
            </Button>
          </form>
        </Form>
        {result && (
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-lg flex items-center justify-between">
              <span>{result.name}</span>
              <Button onClick={handleCopy} size="icon" variant="ghost">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{result.reason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
