"use client";

import type { ReactNode } from 'react';
import React, from 'react';
import { createContext, useContext } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { AppData, Player, Match, Tournament, LiveMatch, AuctionPlayer, ScorecardInning, Auction } from '@/lib/types';

const ADMIN_ID = 'User1';
const ADMIN_PASS = 'Elan2025';

const defaultAppData: AppData = {
  isAdmin: false,
  players: [],
  matches: [],
  tournaments: [],
  liveMatch: null,
  auction: null,
};

type AppContextType = AppData & {
  login: (id: string, pass: string) => boolean;
  logout: () => void;
  addPlayer: (playerData: Omit<Player, 'id' | 'stats'>) => boolean;
  scheduleMatch: (matchData: Omit<Match, 'id' | 'status' | 'result' | 'playerOfTheMatch' | 'scorecard'>) => void;
  scheduleTournament: (tournamentData: Omit<Tournament, 'id' | 'teams' | 'status'>) => void;
  deleteTournament: (tournamentId: number) => void;
  startScoringMatch: (matchId: number) => void;
  performToss: () => void;
  selectTossOption: (option: 'Bat' | 'Bowl') => void;
  scoreRun: (runs: number) => void;
  scoreWicket: () => void;
  scoreExtra: (type: 'Wide' | 'No Ball') => void;
  endMatch: () => void;
  calculateRankings: () => { bestBatsmen: Player[]; bestBowlers: Player[]; bestAllrounders: Player[]; };
  updateLiveMatchInState: (liveMatch: LiveMatch | null) => void;
  startAuction: (tournamentId: number) => void;
  placeBid: (playerId: number, bidAmount: number, teamName: string) => boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appData, setAppData] = useLocalStorage<AppData>('sericrick_app_state', defaultAppData);

  const login = (id: string, pass: string): boolean => {
    if (id === ADMIN_ID && pass === ADMIN_PASS) {
      setAppData(prev => ({ ...prev, isAdmin: true }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAppData(prev => ({ ...prev, isAdmin: false }));
  };

  const addPlayer = (playerData: Omit<Player, 'id' | 'stats'>): boolean => {
    if (appData.players.some(p => p.name === playerData.name)) {
      return false;
    }
    const newPlayer: Player = {
      ...playerData,
      id: Date.now(),
      stats: { matches: 0, runs: 0, wickets: 0, bestScore: 0, bestBowling: '0-0', strikeRate: 0, battingAverage: 0, bowlingEconomy: 0 }
    };
    setAppData(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
    return true;
  };
  
  const scheduleMatch = (matchData: Omit<Match, 'id' | 'status' | 'result' | 'playerOfTheMatch' | 'scorecard'>) => {
    const newMatch: Match = {
      ...matchData,
      id: Date.now(),
      status: 'scheduled',
      result: null,
      playerOfTheMatch: null,
      scorecard: null,
    };
    setAppData(prev => ({ ...prev, matches: [...prev.matches, newMatch] }));
  };

  const scheduleTournament = (tournamentData: Omit<Tournament, 'id' | 'teams' | 'status'>) => {
    const newTournament: Tournament = {
      ...tournamentData,
      id: Date.now(),
      teams: [],
      status: 'scheduled',
    };
    setAppData(prev => ({ ...prev, tournaments: [...prev.tournaments, newTournament]}));
  };

  const deleteTournament = (tournamentId: number) => {
    setAppData(prev => ({
        ...prev,
        tournaments: prev.tournaments.filter(t => t.id !== tournamentId)
    }));
  };

  const startScoringMatch = (matchId: number) => {
    const match = appData.matches.find(m => m.id === matchId);
    if (!match) return;

    const liveMatch: LiveMatch = {
      ...JSON.parse(JSON.stringify(match)),
      status: 'live',
      scorecard: {
        inning1: { team: null, batsmen: {}, bowlers: {}, extraRuns: 0 },
        inning2: { team: null, batsmen: {}, bowlers: {}, extraRuns: 0 }
      },
      currentInning: 1,
      currentBatsmen: { striker: null, nonStriker: null },
      currentBowler: null,
      currentOver: 0,
      ballsInOver: 0,
    };
    setAppData(prev => ({ ...prev, liveMatch }));
  };

  const updateLiveMatchInState = (liveMatch: LiveMatch | null) => {
    setAppData(prev => ({...prev, liveMatch}));
  }

  const performToss = () => {
    if(!appData.liveMatch) return;
    const match = { ...appData.liveMatch };
    const tossWinnerIndex = Math.random() < 0.5 ? 0 : 1;
    match.tossWinner = tossWinnerIndex;
    updateLiveMatchInState(match);
  };

  const selectTossOption = (option: 'Bat' | 'Bowl') => {
    if(!appData.liveMatch || appData.liveMatch.tossWinner === undefined) return;
    const match = { ...appData.liveMatch };
    const tossWinnerIndex = match.tossWinner;
    
    const battingFirstIndex = (option === 'Bat') ? tossWinnerIndex : 1 - tossWinnerIndex;
    const bowlingFirstIndex = 1 - battingFirstIndex;

    match.scorecard!.inning1.team = match.teams[battingFirstIndex].name;
    match.scorecard!.inning2.team = match.teams[bowlingFirstIndex].name;

    const battingTeam = match.teams[battingFirstIndex];
    const bowlingTeam = match.teams[bowlingFirstIndex];
    
    match.currentBatsmen = { striker: battingTeam.players[0], nonStriker: battingTeam.players[1] };
    match.currentBowler = bowlingTeam.players[10];

    updateLiveMatchInState(match);
  };

  const _updateScore = (runs: number, isWicket: boolean, isExtra: boolean, isLegalBall: boolean) => {
    if(!appData.liveMatch) return;
    let match = { ...appData.liveMatch };
    const currentInningData = match.scorecard![`inning${match.currentInning}` as 'inning1' | 'inning2'];
    const currentBattingTeam = match.teams.find(t => t.name === currentInningData.team)!;
    
    // Update runs
    currentBattingTeam.runs += runs;
    if(isExtra) currentInningData.extraRuns += runs;

    // Update bowler stats
    if(match.currentBowler){
        const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id, runs: 0, overs: 0, wickets: 0};
        bowlerStats.runs += runs;
    }

    // Update batsman stats if it's not a wide
    if(match.currentBatsmen.striker && !isExtra) {
        const batsmanStats = currentInningData.batsmen[match.currentBatsmen.striker.id] ||= {playerId: match.currentBatsmen.striker.id, runs: 0, balls: 0, fours: 0, sixes: 0, out: false};
        batsmanStats.runs += runs;
        if(runs === 4) batsmanStats.fours +=1;
        if(runs === 6) batsmanStats.sixes +=1;
    }

    if(isLegalBall) {
        match.ballsInOver += 1;
        if(match.currentBatsmen.striker) {
            const batsmanStats = currentInningData.batsmen[match.currentBatsmen.striker.id] ||= {playerId: match.currentBatsmen.striker.id, runs: 0, balls: 0, fours: 0, sixes: 0, out: false};
            batsmanStats.balls +=1;
        }
    }

    if(isWicket) {
        currentBattingTeam.wickets += 1;
        if(match.currentBowler) {
            const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id, runs: 0, overs: 0, wickets: 0};
            bowlerStats.wickets += 1;
        }
        if(match.currentBatsmen.striker) {
             currentInningData.batsmen[match.currentBatsmen.striker.id].out = true;
             const nextBatsman = currentBattingTeam.players.find(p => !currentInningData.batsmen[p.id]?.out && p.id !== match.currentBatsmen.nonStriker?.id);
             match.currentBatsmen.striker = nextBatsman || null;
        }
    } else if (runs % 2 !== 0 && !isExtra) {
        [match.currentBatsmen.striker, match.currentBatsmen.nonStriker] = [match.currentBatsmen.nonStriker, match.currentBatsmen.striker];
    }
    
    if (match.ballsInOver === 6) {
        // complete over
        match.currentOver += 1;
        currentBattingTeam.overs = Math.floor(match.currentOver) + (match.ballsInOver/10);
        if(match.currentBowler) {
            const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id, runs: 0, overs: 0, wickets: 0};
            bowlerStats.overs = Math.floor(bowlerStats.overs) + 1;
        }
        match.ballsInOver = 0;
        [match.currentBatsmen.striker, match.currentBatsmen.nonStriker] = [match.currentBatsmen.nonStriker, match.currentBatsmen.striker];
        
        // change bowler
        const bowlingTeam = match.teams.find(t => t.name !== currentInningData.team)!;
        const currentBowlerIndex = bowlingTeam.players.findIndex(p => p.id === match.currentBowler?.id);
        const nextBowlerIndex = (currentBowlerIndex + 1) % bowlingTeam.players.length; // simple logic for now
        match.currentBowler = bowlingTeam.players[nextBowlerIndex];
    } else {
        currentBattingTeam.overs = match.currentOver + (match.ballsInOver * 0.1);
        if(match.currentBowler){
            const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id, runs: 0, overs: 0, wickets: 0};
            bowlerStats.overs = Math.floor(bowlerStats.overs) + (match.ballsInOver * 0.1);
        }
    }

    if (currentBattingTeam.wickets === 10 || currentBattingTeam.overs >= match.overs) {
        endInning();
    } else {
        updateLiveMatchInState(match);
    }
  };

  const scoreRun = (runs: number) => _updateScore(runs, false, false, true);
  const scoreWicket = () => _updateScore(0, true, false, true);
  const scoreExtra = (type: 'Wide' | 'No Ball') => _updateScore(1, false, true, type === 'No Ball');

  const endInning = () => {
    if(!appData.liveMatch) return;
    let match = { ...appData.liveMatch };
    
    match.teams.find(t => t.name === match.scorecard![`inning${match.currentInning}` as 'inning1' | 'inning2'].team)!.inningCompleted = true;
    match.ballsInOver = 0;
    match.currentOver = 0;

    if (match.currentInning === 1) {
        match.currentInning = 2;
        const battingTeam = match.teams.find(t => t.name === match.scorecard!.inning2.team)!;
        const bowlingTeam = match.teams.find(t => t.name !== match.scorecard!.inning2.team)!;
        match.currentBatsmen = { striker: battingTeam.players[0], nonStriker: battingTeam.players[1] };
        match.currentBowler = bowlingTeam.players[10];
        updateLiveMatchInState(match);
    } else {
        endMatch();
    }
  }

  const endMatch = () => {
    if(!appData.liveMatch) return;
    let match = { ...appData.liveMatch };
    const team1 = match.teams[0];
    const team2 = match.teams[1];

    if (team1.runs > team2.runs) {
        match.result = `${team1.name} won by ${team1.runs - team2.runs} runs`;
    } else if (team2.runs > team1.runs) {
        const wicketsLeft = 10 - team2.wickets;
        match.result = `${team2.name} won by ${wicketsLeft} wickets`;
    } else {
        match.result = "Match Tied";
    }
    match.status = 'completed';
    
    // player of the match
    // ... logic needed

    const finalMatchData: Match = { ...match };
    const updatedMatches = appData.matches.map(m => m.id === finalMatchData.id ? finalMatchData : m);
    setAppData(prev => ({...prev, matches: updatedMatches, liveMatch: null}));
  };

  const calculateRankings = () => {
        const playersWithStats = appData.players.filter(p => p.stats.matches > 0);

        const bestBatsmen = [...playersWithStats]
            .sort((a, b) => b.stats.runs - a.stats.runs)
            .slice(0, 5);

        const bestBowlers = [...playersWithStats]
            .sort((a, b) => b.stats.wickets - a.stats.wickets)
            .slice(0, 5);

        const bestAllrounders = [...playersWithStats]
            .sort((a, b) => {
                const scoreA = a.stats.runs * 0.4 + a.stats.wickets * 20;
                const scoreB = b.stats.runs * 0.4 + b.stats.wickets * 20;
                return scoreB - scoreA;
            })
            .slice(0, 5);

        return { bestBatsmen, bestBowlers, bestAllrounders };
  }
  
  const startAuction = (tournamentId: number) => {
    const tournament = appData.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const playersForAuction: AuctionPlayer[] = appData.players.map(p => ({
        ...p,
        status: 'Unsold',
        bidder: null,
        bidAmount: 0
    }));

    const newAuction: Auction = {
        tournamentId,
        tournamentName: tournament.name,
        players: playersForAuction,
        teams: []
    };

    setAppData(prev => ({...prev, auction: newAuction}));
  };
  
  const placeBid = (playerId: number, bidAmount: number, teamName: string) => {
    if (!appData.auction) return false;

    const auction = { ...appData.auction };
    const playerIndex = auction.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    const player = auction.players[playerIndex];
    if (bidAmount <= player.bidAmount) return false;

    player.bidAmount = bidAmount;
    player.bidder = teamName;
    player.status = 'Sold';

    setAppData(prev => ({...prev, auction}));
    return true;
  };

  return (
    <AppContext.Provider value={{ ...appData, login, logout, addPlayer, scheduleMatch, scheduleTournament, deleteTournament, startScoringMatch, performToss, selectTossOption, scoreRun, scoreWicket, scoreExtra, endMatch, calculateRankings, updateLiveMatchInState, startAuction, placeBid }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
