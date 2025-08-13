"use client";

import { useAppContext } from "@/context/app-context";
import type { Tournament } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function TournamentList() {
  const { tournaments, isAdmin, deleteTournament } = useAppContext();
  const { toast } = useToast();

  const handleDelete = (id: string, name: string) => {
    deleteTournament(id);
    toast({
        title: "Tournament Deleted",
        description: `"${name}" has been deleted.`
    })
  }

  if (tournaments.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-semibold">No Tournaments Yet</h3>
        <p className="text-muted-foreground mt-2">Check back later or, if you're an admin, schedule a new one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((t: Tournament) => (
        <Card key={t.id as string} className="flex flex-col">
          <CardHeader>
            <Badge variant="outline" className="w-fit mb-2">{t.format}</Badge>
            <CardTitle>{t.name}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{t.venue}</span>
            </div>
            {t.dates && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(t.dates.start).toLocaleDateString()} - {new Date(t.dates.end).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild variant="outline">
                <Link href={`/tournaments/${t.id}`}>View Details</Link>
            </Button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the tournament "{t.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(t.id as string, t.name)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
