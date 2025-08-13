
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, User, Menu, Info } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState, useEffect } from 'react';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/matches', label: 'Matches' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/players', label: 'Players' },
];

function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground hover:text-primary">About</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>About SeriCrick</DialogTitle>
          <DialogDescription>
             A feature-rich cricket management and live scoring app designed for passionate and serious cricketers.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              It’s not just another cricket app — SeriCrick brings local tournaments, players, and matches to life with professional-level tracking, real-time updates, and an engaging user experience.
            </p>
            <p>
              Whether you’re a player wanting to showcase your stats, a team manager organizing matches, or a fan following live games, SeriCrick has everything in one place:
            </p>
            <ul className="space-y-3 list-disc list-inside">
                <li>
                    <span className="font-semibold text-foreground">Players Hub</span> – Register as a player, track your career stats, and see your ranking as a batsman, bowler, or all-rounder.
                </li>
                 <li>
                    <span className="font-semibold text-foreground">Matches</span> – View matches by status (Live, Scheduled, Completed), check detailed scoreboards, and celebrate the Player of the Match.
                </li>
                 <li>
                    <span className="font-semibold text-foreground">Tournaments</span> – Organize or join tournaments with multiple formats, auto-scheduled fixtures, and a Player of the Tournament leaderboard.
                </li>
                <li>
                    <span className="font-semibold text-foreground">Live Scoring</span> – Enjoy ball-by-ball live updates with intelligent features like automated strike changes, real-time notifications, and instant match results.
                </li>
                 <li>
                    <span className="font-semibold text-foreground">Player Auction</span> – Host exciting auctions for registered players, create teams, and bring competitive spirit to your tournaments.
                </li>
            </ul>
             <p>
              SeriCrick empowers cricket enthusiasts at every level — from local gully cricket to community tournaments — with professional tools and a smooth, intuitive interface.
            </p>
            <div>
              <p className="font-semibold text-foreground">Developed by:</p>
              <p>Nitin Choudhary</p>
              <p>📧 Email: nchaudhary.836@gmail.com</p>
              <p>💬 Need help with Android or Web App Development? Feel free to reach out — happy to collaborate and assist!</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function Header() {
  const { isAdmin, logout } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const closeSheet = () => setSheetOpen(false);

  return (
    <header className="bg-card rounded-lg shadow-lg p-3 sm:p-4 flex items-center justify-between mb-4 sm:mb-6 sticky top-2 sm:top-4 z-50 max-w-7xl mx-auto">
      <Link href="/" className="flex items-center gap-2">
        <Image src="https://firebasestorage.googleapis.com/v0/b/cricklive-tb354.firebasestorage.app/o/ChatGPT%20Image%20Aug%2011%2C%202025%2C%2011_16_22%20AM.png?alt=media&token=7cf241c1-5e7d-45df-97f2-b861f07a1c1b" alt="CrickSeries Logo" width={40} height={40} className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-primary">SeriCrick</h1>
          <p className="text-xs text-muted-foreground">Serious Cricketers.</p>
        </div>
      </Link>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {navLinks.map((link) => (
          <Button
            key={link.href}
            asChild
            variant="ghost"
            className={cn(
              'transition-colors',
              pathname === link.href ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
        <AboutDialog />
      </nav>

      {/* Admin Actions */}
      <div className="hidden md:block">
        {!isClient ? <Skeleton className="h-10 w-28" /> : (
            <>
            {isAdmin ? (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Admin Menu">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Admin Menu</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/live-scoring">Live Scoring</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/auction">Player Auction</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            ) : (
            <Button asChild>
                <Link href="/admin">
                <User className="mr-2 h-4 w-4" /> Admin Login
                </Link>
            </Button>
            )}
            </>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[240px]">
            <nav className="flex flex-col space-y-4 pt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeSheet}
                  className={cn(
                    "font-medium",
                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground justify-start p-0 h-auto font-medium">About</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>About SeriCrick</DialogTitle>
                    <DialogDescription>
                       A feature-rich cricket management and live scoring app designed for passionate and serious cricketers.
                    </DialogDescription>
                  </DialogHeader>
                   <ScrollArea className="h-[60vh] pr-6">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        It’s not just another cricket app — SeriCrick brings local tournaments, players, and matches to life with professional-level tracking, real-time updates, and an engaging user experience.
                      </p>
                      <p>
                        Whether you’re a player wanting to showcase your stats, a team manager organizing matches, or a fan following live games, SeriCrick has everything in one place:
                      </p>
                       <ul className="space-y-3 list-disc list-inside">
                          <li>
                              <span className="font-semibold text-foreground">Players Hub</span> – Register as a player, track your career stats, and see your ranking as a batsman, bowler, or all-rounder.
                          </li>
                           <li>
                              <span className="font-semibold text-foreground">Matches</span> – View matches by status (Live, Scheduled, Completed), check detailed scoreboards, and celebrate the Player of the Match.
                          </li>
                           <li>
                              <span className="font-semibold text-foreground">Tournaments</span> – Organize or join tournaments with multiple formats, auto-scheduled fixtures, and a Player of the Tournament leaderboard.
                          </li>
                          <li>
                              <span className="font-semibold text-foreground">Live Scoring</span> – Enjoy ball-by-ball live updates with intelligent features like automated strike changes, real-time notifications, and instant match results.
                          </li>
                           <li>
                              <span className="font-semibold text-foreground">Player Auction</span> – Host exciting auctions for registered players, create teams, and bring competitive spirit to your tournaments.
                          </li>
                      </ul>
                       <p>
                        SeriCrick empowers cricket enthusiasts at every level — from local gully cricket to community tournaments — with professional tools and a smooth, intuitive interface.
                      </p>
                      <div>
                        <p className="font-semibold text-foreground">Developed by:</p>
                        <p>Nitin Choudhary</p>
                        <p>📧 Email: nchaudhary.836@gmail.com</p>
                        <p>💬 Need help with Android or Web App Development? Feel free to reach out — happy to collaborate and assist!</p>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Separator />
               {isClient && isAdmin ? (
                 <>
                  <p className="font-semibold text-sm">Admin</p>
                  <Link href="/live-scoring" onClick={closeSheet} className="text-muted-foreground">Live Scoring</Link>
                  <Link href="/auction" onClick={closeSheet} className="text-muted-foreground">Player Auction</Link>
                  <Button onClick={() => { handleLogout(); closeSheet(); }} variant="destructive" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                 </>
               ) : isClient && !isAdmin ? (
                 <Button asChild onClick={closeSheet}>
                   <Link href="/admin">
                     <User className="mr-2 h-4 w-4" /> Admin Login
                   </Link>
                 </Button>
               ) : (
                <Skeleton className="h-10 w-full" />
               )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
