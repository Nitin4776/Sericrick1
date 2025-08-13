"use client";

import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function AuctionDashboard() {
  const { tournaments, auction, startAuction, placeBid } = useAppContext();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const { toast } = useToast();

  const handleStartAuction = () => {
    if (selectedTournamentId) {
      startAuction(selectedTournamentId);
      toast({ title: "Auction Started!", description: "The player auction is now live." });
    }
  };

  const handlePlaceBid = (playerId: number) => {
    const bidAmountInput = document.getElementById(`bid-amount-${playerId}`) as HTMLInputElement;
    const teamNameInput = document.getElementById(`bid-team-${playerId}`) as HTMLInputElement;

    const bidAmount = parseInt(bidAmountInput.value, 10);
    const teamName = teamNameInput.value;

    if (!bidAmount || !teamName) {
      toast({ title: "Invalid Bid", description: "Please enter a bid amount and team name.", variant: "destructive" });
      return;
    }

    const success = placeBid(playerId, bidAmount, teamName);
    if (success) {
      toast({ title: "Bid Placed!", description: `${auction?.players.find(p => p.id === playerId)?.name} sold to ${teamName} for ${bidAmount}.` });
    } else {
      toast({ title: "Bid Too Low", description: "Bid must be higher than the current bid.", variant: "destructive" });
    }
  };


  if (!auction) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Setup Player Auction</CardTitle>
          <CardDescription>Select a tournament to start the player auction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
            <SelectTrigger><SelectValue placeholder="Select a tournament..." /></SelectTrigger>
            <SelectContent>
              {tournaments.map(t => (
                <SelectItem key={t.id as string} value={t.id.toString()}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleStartAuction} disabled={!selectedTournamentId}>Start Auction</Button>
          {tournaments.length === 0 && <p className="text-sm text-muted-foreground">No tournaments available to start an auction.</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Auction: {auction.tournamentName}</CardTitle>
        <CardDescription>Place bids for players.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sold To</TableHead>
                        <TableHead className="text-right">Bid</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {auction.players.map(p => (
                        <TableRow key={p.id as string}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{p.role}</TableCell>
                            <TableCell>
                                <Badge variant={p.status === 'Sold' ? 'default' : 'secondary'}>{p.status}</Badge>
                            </TableCell>
                            <TableCell>{p.bidder || 'N/A'}</TableCell>
                            <TableCell className="text-right font-mono">{p.bidAmount > 0 ? `$${p.bidAmount}` : '-'}</TableCell>
                            <TableCell>
                                {p.status === 'Unsold' && (
                                    <div className="flex gap-2">
                                        <Input type="number" id={`bid-amount-${p.id}`} placeholder="Amount" className="w-24 h-9" />
                                        <Input id={`bid-team-${p.id}`} placeholder="Team Name" className="w-32 h-9" />
                                        <Button size="sm" onClick={() => handlePlaceBid(p.id as number)}>Bid</Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
