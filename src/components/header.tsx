"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, LogOut, ShieldCheck, User, Menu } from 'lucide-react';
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
import { useState } from 'react';
import { Separator } from './ui/separator';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/matches', label: 'Matches' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/players', label: 'Players' },
];

export function Header() {
  const { isAdmin, logout } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const closeSheet = () => setSheetOpen(false);

  return (
    <header className="bg-card rounded-lg shadow-lg p-3 sm:p-4 flex items-center justify-between mb-4 sm:mb-6 sticky top-2 sm:top-4 z-50 max-w-7xl mx-auto">
      <Link href="/" className="flex items-center gap-2">
        <Swords className="h-8 w-8 text-primary" />
        <h1 className="text-xl sm:text-3xl font-bold text-primary">CrickSeries</h1>
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
      </nav>

      {/* Admin Actions */}
      <div className="hidden md:block">
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
              <Separator />
               {isAdmin ? (
                 <>
                  <p className="font-semibold text-sm">Admin</p>
                  <Link href="/live-scoring" onClick={closeSheet} className="text-muted-foreground">Live Scoring</Link>
                  <Link href="/auction" onClick={closeSheet} className="text-muted-foreground">Player Auction</Link>
                  <Button onClick={() => { handleLogout(); closeSheet(); }} variant="destructive" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                 </>
               ) : (
                 <Button asChild onClick={closeSheet}>
                   <Link href="/admin">
                     <User className="mr-2 h-4 w-4" /> Admin Login
                   </Link>
                 </Button>
               )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
