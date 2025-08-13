
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, writeBatch, getDoc, arrayUnion } from 'firebase/firestore';
import type { AppData, Player, Match, Tournament, LiveMatch, AuctionPlayer, Auction, PlayerStats, TeamInTournament, TeamInMatch } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/hooks/use-toast';

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
  deleteMatch: (matchId: string) => Promise<void>;
  scheduleTournament: (tournamentData: Omit<Tournament, 'id' | 'teams' | 'status'>) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  registerTeamForTournament: (tournamentId: string, teamData: Omit<TeamInTournament, 'id'>) => Promise<boolean>;
  startTournament: (tournamentId: string) => Promise<void>;
  closeTournament: (tournamentId: string) => Promise<void>;
  startScoringMatch: (matchId: string) => void;
  leaveLiveMatch: () => void;
  performToss: () => void;
  selectTossOption: (option: 'Bat' | 'Bowl') => void;
  scoreRun: (runs: number, isDeclared?: boolean) => void;
  scoreWicket: () => void;
  scoreExtra: (type: 'Wide' | 'No Ball') => void;
  endMatch: () => void;
  calculateRankings: () => { bestBatsmen: Player[]; bestBowlers: Player[]; bestAllrounders: Player[]; };
  updateLiveMatchInState: (liveMatch: LiveMatch | null) => void;
  startAuction: (tournamentId: string) => void;
  placeBid: (playerId: number, bidAmount: number, teamName: string) => boolean;
  setLivePlayers: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
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
    const unsubMatches = onSnapshot(query(collection(db, "matches")), (snapshot) => {
        setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Match)).sort((a,b) => String(a.id).localeCompare(String(b.id))));
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
      stats: { 
        matches: 0, 
        runs: 0, 
        wickets: 0, 
        bestScore: 0, 
        bestBowling: '0-0', 
        strikeRate: 0, 
        battingAverage: 0, 
        ballsFaced: 0, 
        oversBowled: 0, 
        runsConceded: 0,
        timesOut: 0,
      }
    };
    await addDoc(collection(db, "players"), newPlayer);
    return true;
  };
  
  const scheduleMatch = async (matchData: Omit<Match, 'id' | 'status' | 'result' | 'playerOfTheMatch' | 'scorecard'>) => {
    const docRef = await addDoc(collection(db, "matches"), {});
    const newMatch: Omit<Match, 'id'> = {
      ...matchData,
      id: docRef.id,
      status: 'scheduled',
      result: null,
      playerOfTheMatch: null,
      scorecard: null,
    };
    await updateDoc(docRef, newMatch);
  };

  const deleteMatch = async (matchId: string) => {
    if (liveMatch && liveMatch.id === matchId) {
        alert("Cannot delete a match that is currently live.");
        return;
    }
    await deleteDoc(doc(db, "matches", matchId));
  };

  const scheduleTournament = async (tournamentData: Omit<Tournament, 'id' | 'teams' | 'status' | 'scheduledMatches'>) => {
    const newTournament: Omit<Tournament, 'id'> = {
      ...tournamentData,
      teams: [],
      status: 'scheduled',
      scheduledMatches: []
    };
    await addDoc(collection(db, "tournaments"), newTournament);
  };
  
  const registerTeamForTournament = async (tournamentId: string, teamData: Omit<TeamInTournament, 'id'>): Promise<boolean> => {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);

    if (!tournamentDoc.exists()) {
      console.error("Tournament not found");
      return false;
    }
    
    const tournament = tournamentDoc.data() as Tournament;

    if(tournament.teams.find(t => t.name === teamData.name)) {
        toast({ title: "Team Exists", description: `A team with the name "${teamData.name}" is already registered.`, variant: "destructive" });
        return false;
    }

    const newTeam = {
        id: new Date().getTime().toString(), // simple unique id
        ...teamData
    }

    await updateDoc(tournamentRef, {
        teams: arrayUnion(newTeam)
    });
    return true;
  };

  const deleteTournament = async (tournamentId: string) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
  };

  const startTournament = async (tournamentId: string) => {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    if (!tournamentDoc.exists()) {
        toast({ title: "Error", description: "Tournament not found.", variant: "destructive"});
        return;
    }

    const tournament = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament;
    if (tournament.status !== 'scheduled') {
        toast({ title: "Error", description: "Tournament has already started.", variant: "destructive"});
        return;
    }

    const scheduledMatchIds: string[] = [];
    const batch = writeBatch(db);

    const teamsInTournament = tournament.teams.map(t => {
        const teamPlayers = players.filter(p => t.playerIds.includes(p.id as string));
        return {
            name: t.name,
            players: teamPlayers,
            runs: 0, wickets: 0, overs: 0, inningCompleted: false
        }
    });

    if (tournament.format === 'Series (2 Teams)') {
        if (teamsInTournament.length !== 2) {
            toast({ title: "Error", description: "A Series format requires exactly 2 registered teams.", variant: "destructive"});
            return;
        }
        for (let i = 0; i < (tournament.numberOfMatches || 1); i++) {
            const matchRef = doc(collection(db, "matches"));
            batch.set(matchRef, {
                overs: 8, // Default overs, can be configurable later
                venue: tournament.venue,
                teams: [teamsInTournament[0], teamsInTournament[1]],
                status: 'scheduled',
                result: null,
                playerOfTheMatch: null,
                scorecard: null,
                tournamentId: tournament.id,
                id: matchRef.id,
            });
            scheduledMatchIds.push(matchRef.id);
        }
    } else if (tournament.format === 'Round Robin') {
        if (teamsInTournament.length < 2) {
             toast({ title: "Error", description: "Round Robin format requires at least 2 teams.", variant: "destructive"});
             return;
        }
        for (let i = 0; i < teamsInTournament.length; i++) {
            for (let j = i + 1; j < teamsInTournament.length; j++) {
                const matchRef = doc(collection(db, "matches"));
                 batch.set(matchRef, {
                    overs: 8,
                    venue: tournament.venue,
                    teams: [teamsInTournament[i], teamsInTournament[j]],
                    status: 'scheduled',
                    result: null,
                    playerOfTheMatch: null,
                    scorecard: null,
                    tournamentId: tournament.id,
                    id: matchRef.id,
                });
                scheduledMatchIds.push(matchRef.id);
            }
        }
    } else {
        toast({ title: "Coming Soon", description: `Automatic scheduling for "${tournament.format}" is not yet implemented.`});
        return; // Do not proceed if format is not handled
    }
    
    batch.update(tournamentRef, { status: 'ongoing', scheduledMatches: scheduledMatchIds });
    
    await batch.commit();
    toast({ title: "Tournament Started!", description: `Matches have been scheduled for ${tournament.name}`});
  }

  const closeTournament = async (tournamentId: string) => {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tournamentRef, { status: 'completed' });
    toast({ title: "Tournament Closed", description: "The tournament has been marked as completed."});
  };

  const startScoringMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !players.length) return;
  
    const getPlayerById = (playerId: string | { id: string }) => {
        const pId = typeof playerId === 'object' ? playerId.id : playerId;
        return players.find(p => p.id === pId);
    }
  
    const team1Players = match.teams[0].players.map(p_id => getPlayerById(p_id as any)).filter(p => p) as Player[];
    const team2Players = match.teams[1].players.map(p_id => getPlayerById(p_id as any)).filter(p => p) as Player[];
  
    const liveMatchData: LiveMatch = {
      ...JSON.parse(JSON.stringify(match)),
      id: String(match.id),
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
      previousBowlerId: null,
      currentOver: 0,
      ballsInOver: 0,
      overEvents: [],
    };
    setLiveMatch(liveMatchData);
  };

  const leaveLiveMatch = () => {
    setLiveMatch(null);
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

    updateLiveMatchInState(match);
  };
  
  const setLivePlayers = (strikerId: string, nonStrikerId: string, bowlerId: string) => {
    if (!liveMatch) return;

    let match = { ...liveMatch };

    const battingTeamName = match.scorecard?.[`inning${match.currentInning}` as 'inning1' | 'inning2'].team;
    const battingTeam = match.teams.find(t => t.name === battingTeamName);
    const bowlingTeam = match.teams.find(t => t.name !== battingTeamName);

    if (!battingTeam || !bowlingTeam) return;

    const striker = battingTeam.players.find(p => p.id === strikerId) || null;
    const nonStriker = battingTeam.players.find(p => p.id === nonStrikerId) || null;
    const bowler = bowlingTeam.players.find(p => p.id === bowlerId) || null;
    
    match.currentBatsmen = { striker, nonStriker };
    match.currentBowler = bowler;
    
    updateLiveMatchInState(match);
  };

  const _updateScore = (runs: number, isWicket: boolean, isExtra: boolean, isLegalBall: boolean, isDeclared: boolean = false) => {
    if(!liveMatch || !liveMatch.currentBatsmen.striker || !liveMatch.currentBowler) return;

    let match = { ...liveMatch };
    if (!match.overEvents) {
      match.overEvents = [];
    }
    
    const currentInningData = match.scorecard![`inning${match.currentInning}` as 'inning1' | 'inning2'];
    const currentBattingTeam = match.teams.find(t => t.name === currentInningData.team)!;

    let event = isWicket ? 'W' : `${runs}`;
    if (isExtra) event += 'wd'; // simplified for now
    match.overEvents.push(event);
    
    currentBattingTeam.runs += runs;
    if(isExtra) currentInningData.extraRuns += (runs);

    const bowlerStats = currentInningData.bowlers[match.currentBowler.id] ||= {playerId: match.currentBowler.id as string, runs: 0, overs: 0, wickets: 0};
    bowlerStats.runs += runs;

    const batsmanStats = currentInningData.batsmen[match.currentBatsmen.striker.id] ||= {playerId: match.currentBatsmen.striker.id as string, runs: 0, balls: 0, fours: 0, sixes: 0, out: false};
    if(!isExtra) {
        batsmanStats.runs += runs;
        if(runs === 4) batsmanStats.fours +=1;
        if(runs === 6) batsmanStats.sixes +=1;
    }

    if(isLegalBall) {
        match.ballsInOver += 1;
        batsmanStats.balls +=1;
    }

    if(isWicket) {
        currentBattingTeam.wickets += 1;
        bowlerStats.wickets += 1;
        batsmanStats.out = true;
        match.currentBatsmen.striker = null; // Prompt for new batsman
    } else if (runs % 2 !== 0 && !isExtra && !isDeclared) {
        [match.currentBatsmen.striker, match.currentBatsmen.nonStriker] = [match.currentBatsmen.nonStriker, match.currentBatsmen.striker];
    }
    
    if (match.ballsInOver === 6) {
        match.currentOver += 1;
        bowlerStats.overs = parseFloat((Math.floor(bowlerStats.overs) + 1).toFixed(1));
        match.ballsInOver = 0;
        match.overEvents = [];
        
        [match.currentBatsmen.striker, match.currentBatsmen.nonStriker] = [match.currentBatsmen.nonStriker, match.currentBatsmen.striker];
        
        match.previousBowlerId = match.currentBowler.id;
        match.currentBowler = null; // Prompt for new bowler
    } else {
         bowlerStats.overs = parseFloat((Math.floor(bowlerStats.overs) + (match.ballsInOver / 10)).toFixed(1));
    }

    currentBattingTeam.overs = parseFloat((match.currentOver + (match.ballsInOver * 0.1)).toFixed(1));

    if (currentBattingTeam.wickets === (currentBattingTeam.players.length - 1) || match.currentOver >= match.overs) {
        endInning();
    } else {
        updateLiveMatchInState(match);
    }
  };

  const scoreRun = (runs: number, isDeclared: boolean = false) => _updateScore(runs, false, false, true, isDeclared);
  const scoreWicket = () => _updateScore(0, true, false, true);
  const scoreExtra = (type: 'Wide' | 'No Ball') => {
    const isLegal = type === 'No Ball';
    _updateScore(1, false, true, isLegal);
  }

  const endInning = () => {
    if(!liveMatch) return;
    let match = { ...liveMatch };
    
    const currentInningLabel = `inning${match.currentInning}` as 'inning1' | 'inning2';
    const currentInningTeamName = match.scorecard![currentInningLabel].team;
    const team = match.teams.find(t => t.name === currentInningTeamName);
    if(team) team.inningCompleted = true;
    
    match.ballsInOver = 0;
    match.currentOver = 0;
    match.overEvents = [];
    match.currentBatsmen = { striker: null, nonStriker: null };
    match.currentBowler = null;
    match.previousBowlerId = null;

    if (match.currentInning === 1) {
        match.currentInning = 2;
        toast({
          title: "Innings End",
          description: "The first innings is complete. Please set up players for the second innings.",
        });
        updateLiveMatchInState(match);
    } else {
        endMatch();
    }
  }

  const endMatch = async () => {
    if(!liveMatch) return;

    const matchRef = doc(db, "matches", liveMatch.id as string);
    const matchDoc = await getDoc(matchRef);

    if (!matchDoc.exists()) {
      setLiveMatch(null);
      return;
    }

    const match: Match = { ...liveMatch };
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

    const batch = writeBatch(db);
    const allPlayerIdsInMatch = [...new Set([...match.teams[0].players.map(p => p.id), ...match.teams[1].players.map(p => p.id)])];
    
    const updatedPlayers: Player[] = [];
    
    for (const playerId of allPlayerIdsInMatch) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        const playerRef = doc(db, "players", playerId as string);
        
        let runsScored = 0, ballsFaced = 0, wicketsTaken = 0, runsConceded = 0, oversBowled = 0;
        let isOut = false;

        const innings = [match.scorecard?.inning1, match.scorecard?.inning2];
        for (const inning of innings) {
            if (inning?.batsmen[playerId]) {
                const batStats = inning.batsmen[playerId];
                runsScored += batStats.runs;
                ballsFaced += batStats.balls;
                if(batStats.out) isOut = true;
            }
            if (inning?.bowlers[playerId]) {
                const bowlStats = inning.bowlers[playerId];
                wicketsTaken += bowlStats.wickets;
                runsConceded += bowlStats.runs;
                oversBowled += bowlStats.overs;
            }
        }
        
        const existingStats = player.stats || { matches: 0, runs: 0, wickets: 0, ballsFaced: 0, oversBowled: 0, runsConceded: 0, bestScore: 0, bestBowling: '0-0', timesOut: 0 };
        
        const newMatches = (existingStats.matches || 0) + 1;
        const newRuns = (existingStats.runs || 0) + runsScored;
        const newBallsFaced = (existingStats.ballsFaced || 0) + ballsFaced;
        const newWickets = (existingStats.wickets || 0) + wicketsTaken;
        const newOversBowled = (existingStats.oversBowled || 0) + oversBowled;
        const newRunsConceded = (existingStats.runsConceded || 0) + runsConceded;
        const totalTimesOut = (existingStats.timesOut || 0) + (isOut ? 1 : 0);

        const updatedStats: PlayerStats = {
          matches: newMatches,
          runs: newRuns,
          wickets: newWickets,
          ballsFaced: newBallsFaced,
          oversBowled: newOversBowled,
          runsConceded: newRunsConceded,
          timesOut: totalTimesOut,
          bestScore: Math.max(existingStats.bestScore || 0, runsScored),
          bestBowling: existingStats.bestBowling, // Note: Best bowling logic needs to be implemented
          battingAverage: totalTimesOut > 0 ? newRuns / totalTimesOut : newRuns,
          strikeRate: newBallsFaced > 0 ? (newRuns / newBallsFaced) * 100 : 0,
          bowlingEconomy: newOversBowled > 0 ? newRunsConceded / newOversBowled : 0,
        };

        batch.update(playerRef, { stats: updatedStats });
        updatedPlayers.push({ ...player, stats: updatedStats });
      }
    }
    
    const finalMatchData: Partial<Match> = {
        ...match,
        scorecard: match.scorecard || null,
        result: match.result,
        status: match.status,
    }
    delete (finalMatchData as any).currentBatsmen;
    delete (finalMatchData as any).currentBowler;
    delete (finalMatchData as any).currentInning;
    delete (finalMatchData as any).currentOver;
    delete (finalMatchData as any).ballsInOver;
    delete (finalMatchData as any).overEvents;
    delete (finalMatchData as any).previousBowlerId;
    delete (finalMatchData as any).tossWinner;


    batch.update(matchRef, finalMatchData);
    
    await batch.commit();

    setPlayers(currentPlayers => 
        currentPlayers.map(p => {
            const updatedPlayer = updatedPlayers.find(up => up.id === p.id);
            return updatedPlayer || p;
        })
    );

    setLiveMatch(null);
  };

  const calculateRankings = () => {
        const playersWithStats = players.filter(p => p.stats && p.stats.matches > 0);
        const bestBatsmen = [...playersWithStats].sort((a, b) => (b.stats?.runs || 0) - (a.stats?.runs || 0)).slice(0, 5);
        const bestBowlers = [...playersWithStats].sort((a, b) => (b.stats?.wickets || 0) - (a.stats?.wickets || 0)).slice(0, 5);
        const bestAllrounders = [...playersWithStats]
            .filter(p => (p.stats?.runs || 0) > 0 && (p.stats?.wickets || 0) > 0)
            .sort((a, b) => ((b.stats?.runs || 0) * 0.4 + (b.stats?.wickets || 0) * 20) - ((a.stats?.runs || 0) * 0.4 + (a.stats?.wickets || 0) * 20)).slice(0, 5);
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
    <AppContext.Provider value={{ ...appData, login, logout, addPlayer, scheduleMatch, deleteMatch, scheduleTournament, deleteTournament, registerTeamForTournament, startTournament, closeTournament, startScoringMatch, leaveLiveMatch, performToss, selectTossOption, scoreRun, scoreWicket, scoreExtra, endMatch, calculateRankings, updateLiveMatchInState, startAuction, placeBid, setLivePlayers }}>
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
