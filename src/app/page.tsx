"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Swords, Trophy, Users, Radio, Gavel } from 'lucide-react';

const features = [
  {
    title: 'Matches',
    description: 'View live, scheduled, and completed matches with detailed scoreboards.',
    href: '/matches',
    icon: <Swords className="h-8 w-8" />,
  },
  {
    title: 'Tournaments',
    description: 'Explore tournament details, register teams, and see the schedule.',
    href: '/tournaments',
    icon: <Trophy className="h-8 w-8" />,
  },
  {
    title: 'Players',
    description: 'Add yourself as a player and view stats and rankings.',
    href: '/players',
    icon: <Users className="h-8 w-8" />,
  },
  {
    title: 'Live Scoring',
    description: 'Score matches ball-to-ball and get real-time updates (Admin only).',
    href: '/live-scoring',
    icon: <Radio className="h-8 w-8" />,
  },
  {
    title: 'Player Auction',
    description: 'Conduct auctions for players linked to a tournament (Admin only).',
    href: '/auction',
    icon: <Gavel className="h-8 w-8" />,
  },
];

export default function Home() {
  return (
    <div className="animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {features.map((feature) => (
          <Link href={feature.href} key={feature.title} className="flex">
            <Card className="hover:shadow-lg hover:border-primary transition-all duration-200 cursor-pointer w-full flex flex-col">
              <CardHeader className="flex-grow">
                <CardTitle className="flex items-center gap-4 text-primary mb-2">
                  {feature.icon}
                  <span>{feature.title}</span>
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
