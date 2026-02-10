"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/lib/auth";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  evaluador: "Evaluador",
  consulta: "Consulta",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800",
  evaluador: "bg-blue-100 text-blue-800",
  consulta: "bg-green-100 text-green-800",
};

export function Header({
  userName,
  userRole,
}: {
  userName: string;
  userRole: UserRole;
}) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className={roleColors[userRole]}>
          {roleLabels[userRole]}
        </Badge>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline-block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
