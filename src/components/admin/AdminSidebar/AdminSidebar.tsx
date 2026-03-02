import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useGetPools } from "@/hooks/useGetPools";
import { LayoutDashboard, Waves, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";

export function AdminSidebar() {
  const { data: pools } = useGetPools();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 font-bold text-blue-600">
          <Waves className="size-6" />
          <span className="group-data-[collapsible=icon]:hidden">
            Cattleya Admin
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <NavLink to="/admin/dashboard">
                    <LayoutDashboard /> Dashboard
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Pools and Rates">
                  <NavLink to="/admin/pools-rates">
                    <LayoutDashboard />
                    Pools and Rates
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Reservation Page Editor">
                  <NavLink to="/admin/reservation-editor">
                    <LayoutDashboard />
                    Reservation Editor
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Manage Pools</SidebarGroupLabel>
          <SidebarGroupContent className="overflow-y-auto">
            <SidebarMenu>
              {pools?.map((pool) => (
                <SidebarMenuItem key={pool.id}>
                  <SidebarMenuButton asChild tooltip={pool.name}>
                    <NavLink to={`/admin/pools/${pool.id}/edit`}>
                      <span className="truncate text-xs">
                        Pool {pool.pool_number}: {pool.name}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-red-500">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
