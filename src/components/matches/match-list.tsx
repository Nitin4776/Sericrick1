"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import type { Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScorecardDialog } from "./scorecard-dialog";
import { useToast } from "@/hooks/use-toast";
import { Radio, CheckCircle, Calendar, PlayCircle, Trash2 } from "lucide-react";
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

export function MatchList() {
  const { matches, isAdmin, startScoringMatch, deleteMatch } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isScorecardOpen, setScorecardOpen] = useState(false);

  const handleStartScoring = (matchId: string) => {
    startScoringMatch(matchId);
    toast({
        title: "Live scoring started!",
        description: "You are now in the live scoring dashboard."
    });
    router.push('/live-scoring');
  };

  const handleViewScorecard = (match: Match) => {
    if (!match.scorecard) {
        toast({ title: "No Scorecard", description: "Scorecard is not available for this match.", variant: "destructive"});
        return;
    }
    setSelectedMatch(match);
    setScorecardOpen(true);
  };

  const handleDeleteMatch = (matchId: string, matchName: string) => {
    deleteMatch(matchId);
    toast({
        title: "Match Deleted",
        description: `The match "${matchName}" has been deleted.`
    })
  }
  
  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'live': return <Badge className="bg-red-500 hover:bg-red-600 text-white"><Radio className="h-3 w-3 mr-1 animate-pulse" />Live</Badge>;
      case 'completed': return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'scheduled': return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Scheduled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const renderMatchList = (title: string, filteredMatches: Match[]) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredMatches.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No matches in this category.</p>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map(m => (
              <div key={m.id as string} className="p-4 bg-background rounded-md border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">{getStatusBadge(m.status)}</div>
                  <p className="font-bold">{m.teams[0].name} vs {m.teams[1].name}</p>
                  <p className="text-xs text-muted-foreground">{m.venue}, {m.overs} Overs</p>
                  {m.result && <p className="text-xs text-primary font-semibold mt-1">{m.result}</p>}
                </div>
                <div className="flex space-x-2 shrink-0">
                  {m.status === 'scheduled' && isAdmin && (
                    <Button onClick={() => handleStartScoring(m.id as string)} size="sm">
                        <PlayCircle className="h-4 w-4 mr-2" /> Start Scoring
                    </Button>
                  )}
                  {m.status === 'completed' && (
                    <Button onClick={() => handleViewScorecard(m)} variant="outline" size="sm">
                        View Scorecard
                    </Button>
                  )}
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
                            This action cannot be undone. This will permanently delete the match: {m.teams[0].name} vs {m.teams[1].name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMatch(m.id as string, `${m.teams[0].name} vs ${m.teams[1].name}`)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
        {renderMatchList("Live Matches", matches.filter(m => m.status === 'live'))}
        {renderMatchList("Scheduled Matches", matches.filter(m => m.status === 'scheduled'))}
        {renderMatchList("Completed Matches", matches.filter(m => m.status === 'completed'))}
        <ScorecardDialog match={selectedMatch} isOpen={isScorecardOpen} onOpenChange={setScorecardOpen} />
    </div>
  );
}
