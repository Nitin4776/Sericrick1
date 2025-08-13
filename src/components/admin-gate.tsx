"use client";

import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

export function AdminGate({ children, block = true, message = "You must be an administrator to view this page." }: { children: React.ReactNode, block?: boolean, message?: string }) {
  const { isAdmin } = useAppContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return block ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                    <Skeleton className="h-6 w-32 mt-4 mx-auto" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full mb-6" />
                    <Skeleton className="h-10 w-32 mx-auto" />
                </CardContent>
            </Card>
        </div>
    ) : (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (!isAdmin) {
    if (block) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                <ShieldAlert className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="mt-4">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <Button asChild>
                <Link href="/admin">Go to Admin Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-500" />Admin Task</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{message}</p>
            </CardContent>
        </Card>
    );
  }

  return <>{children}</>;
}
