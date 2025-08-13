"use client";

import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function PlayerList() {
  const { players } = useAppContext();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Batsman': return 'default';
      case 'Bowler': return 'secondary';
      case 'All-rounder': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Players</CardTitle>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-center text-muted-foreground">No players added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Society</TableHead>
                  <TableHead className="text-right">Matches</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Wickets</TableHead>
                  <TableHead className="text-right">Bat Avg</TableHead>
                  <TableHead className="text-right">SR</TableHead>
                  <TableHead className="text-right">Econ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant={getRoleBadgeVariant(p.role)}>{p.role}</Badge></TableCell>
                    <TableCell>{p.team || '-'}</TableCell>
                    <TableCell>{p.society || '-'}</TableCell>
                    <TableCell className="text-right">{p.stats?.matches ?? 0}</TableCell>
                    <TableCell className="text-right">{p.stats?.runs ?? 0}</TableCell>
                    <TableCell className="text-right">{p.stats?.wickets ?? 0}</TableCell>
                    <TableCell className="text-right">{p.stats?.battingAverage?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell className="text-right">{p.stats?.strikeRate?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell className="text-right">{p.stats?.bowlingEconomy?.toFixed(2) ?? '0.00'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
