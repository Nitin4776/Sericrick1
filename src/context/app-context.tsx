
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { AppData, Player, Match, Tournament, LiveMatch, AuctionPlayer, Auction } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

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
  addPlayer: (playerData: Omit<Player, 'id' | 'stats'>) => Promise<boolean>;
  scheduleMatch: (matchData: Omit<Match, 'id' | 'status' | 'result' | 'playerOfTheMatch' | 'scorecard'>) => Promise<void>;
  scheduleTournament: (tournamentData: Omit<Tournament, 'id' | 'teams' | 'status'>) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  startScoringMatch: (matchId: string) => void;
  performToss: () => void;
  selectTossOption: (option: 'Bat' | 'Bowl') => void;
  scoreRun: (runs: number) => void;
  scoreWicket: () => void;
  scoreExtra: (type: 'Wide' | 'No Ball') => void;
  endMatch: () => void;
  calculateRankings: () => { bestBatsmen: Player[]; bestBowlers: Player[]; bestAllrounders: Player[]; };
  updateLiveMatchInState: (liveMatch: LiveMatch | null) => void;
  startAuction: (tournamentId: string) => void;
  placeBid: (playerId: number, bidAmount: number, teamName: string) => boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('sericrick_admin_status', false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [liveMatch, setLiveMatch] = useLocalStorage<LiveMatch | null>('sericrick_live_match', null);
  const [auction, setAuction] = useLocalStorage<Auction | null>('sericrick_auction', null);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, "players"), (snapshot) => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Player)));
    });
    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Match)));
    });
    const unsubTournaments = onSnapshot(collection(db, "tournaments"), (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Tournament)));
    });

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubTournaments();
    };
  }, []);

  const login = (id: string, pass: string): boolean => {
    if (id === ADMIN_ID && pass === ADMIN_PASS) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
  };

  const addPlayer = async (playerData: Omit<Player, 'id' | 'stats'>): Promise<boolean> => {
    const q = query(collection(db, "players"), where("name", "==", playerData.name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return false; // Player already exists
    }

    const newPlayer: Omit<Player, 'id'> = {
      ...playerData,
      stats: { matches: 0, runs: 0, wickets: 0, bestScore: 0, bestBowling: '0-0', strikeRate: 0, battingAverage: 0, bowlingEconomy: 0 }
    };
    await addDoc(collection(db, "players"), newPlayer);
    return true;
  };
  
  const scheduleMatch = async (matchData: Omit<Match, 'id' | 'status' | 'result' | 'playerOfTheMatch' | 'scorecard'>) => {
    const newMatch: Omit<Match, 'id'> = {
      ...matchData,
      status: 'scheduled',
      result: null,
      playerOfTheMatch: null,
      scorecard: null,
    };
    await addDoc(collection(db, "matches"), newMatch);
  };

  const scheduleTournament = async (tournamentData: Omit<Tournament, 'id' | 'teams' | 'status'>) => {
    const newTournament: Omit<Tournament, 'id'> = {
      ...tournamentData,
      teams: [],
      status: 'scheduled',
    };
    await addDoc(collection(db, "tournaments"), newTournament);
  };

  const deleteTournament = async (tournamentId: string) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
  };

  const startScoringMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    // Find the full player objects for each team
    const team1Players = match.teams[0].players.map(p_id => players.find(p => p.id === p_id)).filter(p => p) as Player[];
    const team2Players = match.teams[1].players.map(p_id => players.find(p => p.id === p_id)).filter(p => p) as Player[];

    const liveMatchData: LiveMatch = {
      ...JSON.parse(JSON.stringify(match)), // Deep copy to avoid mutation issues
      teams: [
        { ...match.teams[0], players: team1Players },
        { ...match.teams[1], players: team2Players }
      ],
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
    setLiveMatch(liveMatchData);
  };
  
  const updateLiveMatchInState = (liveMatchData: LiveMatch | null) => {
    setLiveMatch(liveMatchData);
  }

  const performToss = () => {
    if(!liveMatch) return;
    const match = { ...liveMatch };
    const tossWinnerIndex = Math.random() < 0.5 ? 0 : 1;
    match.tossWinner = tossWinnerIndex;
    updateLiveMatchInState(match);
  };

  const selectTossOption = (option: 'Bat' | 'Bowl') => {
    if(!liveMatch || liveMatch.tossWinner === undefined) return;
    const match = { ...liveMatch };
    const tossWinnerIndex = match.tossWinner;
    
    const battingFirstIndex = (option === 'Bat') ? tossWinnerIndex : 1 - tossWinnerIndex;
    const bowlingFirstIndex = 1 - battingFirstIndex;

    match.scorecard!.inning1.team = match.teams[battingFirstIndex].name;
    match.scorecard!.inning2.team = match.teams[bowlingFirstIndex].name;

    const battingTeam = match.teams[battingFirstIndex];
    const bowlingTeam = match.teams[bowlingFirstIndex];
    
    match.currentBatsmen = { striker: battingTeam.players[0], nonStriker: battingTeam.players[1] };
    match.currentBowler = bowlingTeam.players[bowlingTeam.players.length - 1];

    updateLiveMatchInState(match);
  };

  const _updateScore = (runs: number, isWicket: boolean, isExtra: boolean, isLegalBall: boolean) => {
    if(!liveMatch) return;
    let match = { ...liveMatch };
    const currentInningData = match.scorecard![`inning${match.currentInning}` as 'inning1' | 'inning2'];
    const currentBattingTeam = match.teams.find(t => t.name === currentInningData.team)!;
    
    currentBattingTeam.runs += runs;
    if(isExtra) currentInningData.extraRuns += runs;

    if(match.currentBowler){
        const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id, runs: 0, overs: 0, wickets: 0};
        bowlerStats.runs += runs;
    }

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
             const nextBatsmanIndex = currentBattingTeam.players.findIndex(p => p.id === match.currentBatsmen.striker!.id) + 1; // Simplistic
             const nextBatsman = currentBattingTeam.players.find(p => !currentInningData.batsmen[p.id]?.out && p.id !== match.currentBatsmen.nonStriker?.id);
             match.currentBatsmen.striker = nextBatsman || null;
        }
    } else if (runs % 2 !== 0 && !isExtra) {
        [match.currentBatsmen.striker, match.currentBatsmen.nonStriker] = [match.currentBatsmen.nonStriker, match.currentBatsmen.striker];
    }
    
    if (match.ballsInOver === 6) {
        match.currentOver += 1;
        currentBattingTeam.overs = Math.floor(match.currentOver) + (match.ballsInOver/10);
        if(match.currentBowler) {
            const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id, runs: 0, overs: 0, wickets: 0};
            bowlerStats.overs = Math.floor(bowlerStats.overs) + 1;
        }
        match.ballsInOver = 0;
        [match.currentBatsmen.striker, match.currentBatsmen.nonStriker] = [match.currentBatsmen.nonStriker, match.currentBatsmen.striker];
        
        const bowlingTeam = match.teams.find(t => t.name !== currentInningData.team)!;
        const currentBowlerIndex = bowlingTeam.players.findIndex(p => p.id === match.currentBowler?.id);
        const nextBowlerIndex = (currentBowlerIndex - 1 + bowlingTeam.players.length) % bowlingTeam.players.length; 
        match.currentBowler = bowlingTeam.players[nextBowlerIndex];
    } else {
        currentBattingTeam.overs = match.currentOver + (match.ballsInOver * 0.1);
        if(match.currentBowler){
            const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id, runs: 0, overs: 0, wickets: 0};
            bowlerStats.overs = Math.floor(bowlerStats.overs) + (match.ballsInOver * 0.1);
        }
    }

    if (currentBattingTeam.wickets === (currentBattingTeam.players.length - 1) || currentBattingTeam.overs >= match.overs) {
        endInning();
    } else {
        updateLiveMatchInState(match);
    }
  };

  const scoreRun = (runs: number) => _updateScore(runs, false, false, true);
  const scoreWicket = () => _updateScore(0, true, false, true);
  const scoreExtra = (type: 'Wide' | 'No Ball') => _updateScore(1, false, true, type === 'No Ball');

  const endInning = () => {
    if(!liveMatch) return;
    let match = { ...liveMatch };
    
    const currentInningLabel = `inning${match.currentInning}` as 'inning1' | 'inning2';
    const currentInningTeamName = match.scorecard![currentInningLabel].team;
    match.teams.find(t => t.name === currentInningTeamName)!.inningCompleted = true;
    
    match.ballsInOver = 0;
    match.currentOver = 0;

    if (match.currentInning === 1) {
        match.currentInning = 2;
        const battingTeam = match.teams.find(t => t.name === match.scorecard!.inning2.team)!;
        const bowlingTeam = match.teams.find(t => t.name !== match.scorecard!.inning2.team)!;
        match.currentBatsmen = { striker: battingTeam.players[0], nonStriker: battingTeam.players[1] };
        match.currentBowler = bowlingTeam.players[bowlingTeam.players.length - 1];
        updateLiveMatchInState(match);
    } else {
        endMatch();
    }
  }

  const endMatch = async () => {
    if(!liveMatch) return;
    let match: Match = { ...liveMatch };
    const team1 = match.teams[0];
    const team2 = match.teams[1];

    if (team1.runs > team2.runs) {
        match.result = `${team1.name} won by ${team1.runs - team2.runs} runs`;
    } else if (team2.runs > team1.runs) {
        const wicketsLeft = team2.players.length - 1 - team2.wickets;
        match.result = `${team2.name} won by ${wicketsLeft} wickets`;
    } else {
        match.result = "Match Tied";
    }
    match.status = 'completed';

    const matchRef = doc(db, "matches", match.id as string);
    await updateDoc(matchRef, { ...match });
    setLiveMatch(null);
  };

  const calculateRankings = () => {
        const playersWithStats = players.filter(p => p.stats && p.stats.matches > 0);
        const bestBatsmen = [...playersWithStats].sort((a, b) => b.stats.runs - a.stats.runs).slice(0, 5);
        const bestBowlers = [...playersWithStats].sort((a, b) => b.stats.wickets - a.stats.wickets).slice(0, 5);
        const bestAllrounders = [...playersWithStats].sort((a, b) => (b.stats.runs * 0.4 + b.stats.wickets * 20) - (a.stats.runs * 0.4 + a.stats.wickets * 20)).slice(0, 5);
        return { bestBatsmen, bestBowlers, bestAllrounders };
  }
  
  const startAuction = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const playersForAuction: AuctionPlayer[] = players.map(p => ({
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
    setAuction(newAuction);
  };
  
  const placeBid = (playerId: number, bidAmount: number, teamName: string) => {
    if (!auction) return false;

    const newAuction = { ...auction };
    const playerIndex = newAuction.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || bidAmount <= newAuction.players[playerIndex].bidAmount) return false;

    newAuction.players[playerIndex] = { ...newAuction.players[playerIndex], bidAmount, bidder: teamName, status: 'Sold' };
    setAuction(newAuction);
    return true;
  };
  
  const appData = { isAdmin, players, matches, tournaments, liveMatch, auction };

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

    