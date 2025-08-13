

export interface PlayerStats {
  matches: number;
  runs: number;
  wickets: number;
  bestScore: number;
  bestBowling: string;
  strikeRate: number;
  battingAverage: number;
  bowlingEconomy: number;
  ballsFaced?: number;
  oversBowled?: number;
  runsConceded?: number;
  timesOut?: number;
}

export interface Player {
  id: number | string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  role: 'Batsman' | 'Bowler' | 'All-rounder';
  team: string;
  society: string;
  stats: PlayerStats;
}

export interface TeamInMatch {
  name: string;
  players: Player[];
  runs: number;
  wickets: number;
  overs: number;
  inningCompleted: boolean;
}

export interface ScorecardInning {
  team: string | null;
  batsmen: {
    [playerId: string]: {
      playerId: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      out: boolean;
    };
  };
  bowlers: {
    [playerId: string]: {
      playerId: string;
      runs: number;
      overs: number;
      wickets: number;
    };
  };
  extraRuns: number;
}

export interface Scorecard {
  inning1: ScorecardInning;
  inning2: ScorecardInning;
}

export interface Match {
  id: number | string;
  overs: number;
  venue: string;
  teams: [TeamInMatch, TeamInMatch];
  status: 'scheduled' | 'live' | 'completed';
  result: string | null;
  playerOfTheMatch: string | null;
  scorecard: Scorecard | null;
  tournamentId?: string;
}

export interface LiveMatch extends Match {
  tossWinner?: number;
  currentInning: 1 | 2;
  currentBatsmen: {
    striker: Player | null;
    nonStriker: Player | null;
  };
  currentBowler: Player | null;
  previousBowlerId: string | number | null;
  currentOver: number;
  ballsInOver: number;
  overEvents: string[];
}

export interface TeamInTournament {
    id: string;
    name: string;
    playerIds: string[];
}

export type TournamentFormat = 
  | 'Series (2 Teams)'
  | 'Round Robin'
  | 'Group Stage + Knockout'
  | 'Knockout'
  | 'League Table';

export interface Tournament {
  id: number | string;
  name: string;
  venue: string;
  description: string;
  format: TournamentFormat;
  numberOfMatches?: number;
  dates: {
    start: string;
    end: string;
  };
  teams: TeamInTournament[];
  scheduledMatches: string[]; // IDs of matches scheduled for this tournament
  status: 'scheduled' | 'ongoing' | 'completed';
}

export interface AuctionPlayer extends Player {
  status: 'Unsold' | 'Sold';
  bidder: string | null;
  bidAmount: number;
}

export interface Auction {
  tournamentId: number | string;
  tournamentName: string;
  players: AuctionPlayer[];
  teams: any[]; // Replace with a Team type if needed
}

export interface AppData {
  isAdmin: boolean;
  players: Player[];
  matches: Match[];
  tournaments: Tournament[];
  liveMatch: LiveMatch | null;
  auction: Auction | null;
}
