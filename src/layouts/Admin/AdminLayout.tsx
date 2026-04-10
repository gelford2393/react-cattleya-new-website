import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useGetPools } from "@/hooks/useGetPools";
import {
  parseWebsiteSettingsContent,
  useWebsiteSettingsPageQuery,
} from "@/hooks/useWebsiteSettings";
import { Link, matchPath, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type Crumb = {
  label: string;
  href?: string;
  current?: boolean;
};

function getAdminBreadcrumbs(pathname: string, poolEditLabel?: string): Crumb[] {
  if (matchPath("/admin/pools/:poolId/edit", pathname)) {
    return [
      { label: "Admin", href: "/admin/dashboard" },
      { label: "Manage Pools", href: "/admin/pools-rates" },
      { label: poolEditLabel ?? "Edit Pool", current: true },
    ];
  }

  const routeCrumbs: Array<{ pattern: string; label: string; href: string }> = [
    { pattern: "/admin/dashboard", label: "Dashboard", href: "/admin/dashboard" },
    { pattern: "/admin/pools-rates", label: "Pools and Rates", href: "/admin/pools-rates" },
    {
      pattern: "/admin/reservation-editor",
      label: "Reservation Editor",
      href: "/admin/reservation-editor",
    },
    { pattern: "/admin/location-map", label: "Location Map", href: "/admin/location-map" },
    { pattern: "/admin/contact-us", label: "Contact Us", href: "/admin/contact-us" },
    { pattern: "/admin/note", label: "Note", href: "/admin/note" },
    { pattern: "/admin/settings", label: "Settings", href: "/admin/settings" },
  ];

  const matched = routeCrumbs.find((route) => matchPath(route.pattern, pathname));

  if (matched) {
    return [
      { label: "Admin", href: "/admin/dashboard" },
      { label: matched.label, current: true },
    ];
  }

  return [
    { label: "Admin", href: "/admin/dashboard" },
    { label: "Dashboard", current: true },
  ];
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const { data: pools } = useGetPools();
  const { data: websiteSettingsPage } = useWebsiteSettingsPageQuery();
  const websiteSettings = parseWebsiteSettingsContent(websiteSettingsPage?.content);
  const isAdminDark = websiteSettings.adminTheme === "dark";

  const poolEditMatch = matchPath("/admin/pools/:poolId/edit", pathname);
  const currentPool = pools?.find((pool) => pool.id === poolEditMatch?.params.poolId);
  const poolEditLabel = currentPool
    ? `Pool ${currentPool.pool_number}: ${currentPool.name} - Edit`
    : "Edit Pool";

  const breadcrumbs = getAdminBreadcrumbs(pathname, poolEditLabel);

  return (
    <div className={cn(isAdminDark && "dark admin-dark")}> 
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--sidebar-width-icon": "4rem",
          } as React.CSSProperties
        }
      >
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.flatMap((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;

                  const item = (
                    <BreadcrumbItem key={`${crumb.label}-${index}`}>
                      {crumb.current || isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.href ?? "/admin/dashboard"}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  );

                  return isLast
                    ? [item]
                    : [item, <BreadcrumbSeparator key={`separator-${crumb.label}-${index}`} />];
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-slate-50/50">
            <div className="min-h-[100vh] flex-1 rounded-xl md:min-h-min py-6">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
