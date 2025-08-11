"use client";

import type { Match, ScorecardInning, Player } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/context/app-context";

interface ScorecardDialogProps {
  match: Match | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const InningScorecard = ({ inningData, battingTeamName, bowlingTeamName }: { inningData: ScorecardInning, battingTeamName: string, bowlingTeamName: string }) => {
    const { players } = useAppContext();
    if (!inningData || !inningData.team) return null;

    const getPlayerName = (id: number) => players.find(p => p.id === id)?.name || 'Unknown Player';

    const batsmen = Object.values(inningData.batsmen).filter(b => b.balls > 0 || b.runs > 0);
    const bowlers = Object.values(inningData.bowlers).filter(b => b.overs > 0 || b.wickets > 0);

    const battingTeamData = inningData.team === battingTeamName ? { name: battingTeamName } : { name: bowlingTeamName };

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-lg">{battingTeamData.name} Innings</h4>
                <p className="text-muted-foreground">{inningData.team}</p>
            </div>
            <div>
                <h5 className="font-semibold mb-2">Batting</h5>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Batsman</TableHead>
                            <TableHead>R</TableHead>
                            <TableHead>B</TableHead>
                            <TableHead>4s</TableHead>
                            <TableHead>6s</TableHead>
                            <TableHead>SR</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batsmen.map(b => (
                            <TableRow key={b.playerId}>
                                <TableCell>{getPlayerName(b.playerId)}</TableCell>
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
                <h5 className="font-semibold mb-2">Bowling</h5>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bowler</TableHead>
                            <TableHead>O</TableHead>
                            <TableHead>R</TableHead>
                            <TableHead>W</TableHead>
                            <TableHead>Econ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {bowlers.map(b => (
                            <TableRow key={b.playerId}>
                                <TableCell>{getPlayerName(b.playerId)}</TableCell>
                                <TableCell>{b.overs.toFixed(1)}</TableCell>
                                <TableCell>{b.runs}</TableCell>
                                <TableCell>{b.wickets}</TableCell>
                                <TableCell>{(b.overs > 0 ? b.runs / b.overs : 0).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export function ScorecardDialog({ match, isOpen, onOpenChange }: ScorecardDialogProps) {
  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Scorecard: {match.teams[0].name} vs {match.teams[1].name}</DialogTitle>
          <DialogDescription>
            {match.result}
            {match.playerOfTheMatch && ` | Player of the Match: ${match.playerOfTheMatch}`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-4">
            <div className="space-y-8">
                {match.scorecard?.inning1.team && <InningScorecard inningData={match.scorecard.inning1} battingTeamName={match.scorecard.inning1.team} bowlingTeamName={match.scorecard.inning2.team!} />}
                {match.scorecard?.inning2.team && <InningScorecard inningData={match.scorecard.inning2} battingTeamName={match.scorecard.inning2.team} bowlingTeamName={match.scorecard.inning1.team!} />}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
