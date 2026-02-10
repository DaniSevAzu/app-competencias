"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  Users,
  Building2,
  Briefcase,
  FolderTree,
  MapPin,
  UserCog,
  FileText,
  Settings,
  TrendingUp,
  Grid3X3,
  PieChart,
  Layers,
  Link as LinkIcon,
  ListChecks,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "evaluador", "consulta"],
  },
];

const evaluacionesNav: NavItem[] = [
  {
    title: "Evaluaciones",
    href: "/evaluaciones",
    icon: ClipboardCheck,
    roles: ["admin", "evaluador"],
  },
];

const informesNav: NavItem[] = [
  {
    title: "Informe Global",
    href: "/informes/global",
    icon: BarChart3,
    roles: ["admin", "consulta"],
  },
  {
    title: "Análisis por Pilares",
    href: "/informes/pilares",
    icon: Layers,
    roles: ["admin", "consulta"],
  },
  {
    title: "Análisis Potencial",
    href: "/informes/potencial",
    icon: TrendingUp,
    roles: ["admin", "consulta"],
  },
  {
    title: "9-Box Grid",
    href: "/informes/ninebox",
    icon: Grid3X3,
    roles: ["admin", "consulta"],
  },
];

const adminDatosNav: NavItem[] = [
  {
    title: "Trabajadores",
    href: "/admin/trabajadores",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Centros",
    href: "/admin/centros",
    icon: Building2,
    roles: ["admin"],
  },
  {
    title: "Áreas",
    href: "/admin/areas",
    icon: FolderTree,
    roles: ["admin"],
  },
  {
    title: "Puestos",
    href: "/admin/puestos",
    icon: Briefcase,
    roles: ["admin"],
  },
  {
    title: "Colectivos",
    href: "/admin/colectivos",
    icon: PieChart,
    roles: ["admin"],
  },
  {
    title: "UAPs",
    href: "/admin/uaps",
    icon: MapPin,
    roles: ["admin"],
  },
  {
    title: "Usuarios",
    href: "/admin/usuarios",
    icon: UserCog,
    roles: ["admin"],
  },
];

const adminConfigNav: NavItem[] = [
  {
    title: "Plantillas",
    href: "/admin/plantillas",
    icon: FileText,
    roles: ["admin"],
  },
  {
    title: "Config. 9-Box",
    href: "/admin/ninebox",
    icon: Grid3X3,
    roles: ["admin"],
  },
  {
    title: "Tipos Plan Acción",
    href: "/admin/tipos-accion",
    icon: ListChecks,
    roles: ["admin"],
  },
  {
    title: "Integraciones",
    href: "/admin/integraciones",
    icon: LinkIcon,
    roles: ["admin"],
  },
];

function NavGroup({
  label,
  items,
  userRole,
  pathname,
}: {
  label: string;
  items: NavItem[];
  userRole: UserRole;
  pathname: string;
}) {
  const visibleItems = items.filter((item) => item.roles.includes(userRole));
  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href || pathname.startsWith(item.href + "/")}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Competencias SyP</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Principal" items={mainNav} userRole={userRole} pathname={pathname} />
        <NavGroup label="Evaluaciones" items={evaluacionesNav} userRole={userRole} pathname={pathname} />
        <NavGroup label="Informes" items={informesNav} userRole={userRole} pathname={pathname} />
        <NavGroup label="Datos Maestros" items={adminDatosNav} userRole={userRole} pathname={pathname} />
        <NavGroup label="Configuración" items={adminConfigNav} userRole={userRole} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">v1.0.0 - Demo</p>
      </SidebarFooter>
    </Sidebar>
  );
}
