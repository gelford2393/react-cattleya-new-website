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
import {
  parseWebsiteSettingsContent,
  useWebsiteSettingsPageQuery,
} from "@/hooks/useWebsiteSettings";
import {
  LayoutDashboard,
  Waves,
  LogOut,
  MapPin,
  Mail,
  FileText,
  CalendarDays,
  Settings,
} from "lucide-react";
import { DESIGN_TOKENS } from "@/lib/designTokens";
import { NavLink } from "react-router-dom";

export function AdminSidebar() {
  const { data: pools } = useGetPools();
  const { data: settingsPage } = useWebsiteSettingsPageQuery();
  const websiteSettings = parseWebsiteSettingsContent(settingsPage?.content);
  const sidebarBrandIcon = websiteSettings.siteIconUrl?.trim() || "";
  const collapsedButtonClass =
    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-start group-data-[collapsible=icon]:justify-center">
          {sidebarBrandIcon ? (
            <img
              src={sidebarBrandIcon}
              alt="Website icon"
              className="h-10 w-auto max-w-full object-contain transition-[height] duration-200 ease-linear group-data-[collapsible=icon]:h-6"
            />
          ) : (
            <Waves className="size-6 transition-[width,height] duration-200 ease-linear group-data-[collapsible=icon]:size-5" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dashboard"
                  className={collapsedButtonClass}
                >
                  <NavLink to="/admin/dashboard">
                    <LayoutDashboard />
                    <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Pools and Rates"
                  className={collapsedButtonClass}
                >
                  <NavLink to="/admin/pools-rates">
                    <Waves />
                    <span className="group-data-[collapsible=icon]:hidden">Pools and Rates</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Reservation Page Editor"
                  className={collapsedButtonClass}
                >
                  <NavLink to="/admin/reservation-editor">
                    <CalendarDays />
                    <span className="group-data-[collapsible=icon]:hidden">Reservation Editor</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Location Map Editor"
                  className={collapsedButtonClass}
                >
                  <NavLink to="/admin/location-map">
                    <MapPin />
                    <span className="group-data-[collapsible=icon]:hidden">Location Map</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Contact Us Editor"
                  className={collapsedButtonClass}
                >
                  <NavLink to="/admin/contact-us">
                    <Mail />
                    <span className="group-data-[collapsible=icon]:hidden">Contact Us</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Note Editor"
                  className={collapsedButtonClass}
                >
                  <NavLink to="/admin/note">
                    <FileText />
                    <span className="group-data-[collapsible=icon]:hidden">Note</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Website Settings"
                  className={collapsedButtonClass}
                >
                  <NavLink to="/admin/settings">
                    <Settings />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
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

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`${DESIGN_TOKENS.classes.adminDangerText} ${collapsedButtonClass}`}
            >
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
