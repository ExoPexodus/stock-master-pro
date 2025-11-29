import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Warehouse,
  Users, 
  ShoppingCart, 
  FileText,
  Upload,
  LogOut
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer'] },
  { title: 'Items', url: '/items', icon: Package, roles: ['admin', 'manager', 'viewer'] },
  { title: 'Categories', url: '/categories', icon: FolderTree, roles: ['admin', 'manager', 'viewer'] },
  { title: 'Warehouses', url: '/warehouses', icon: Warehouse, roles: ['admin', 'manager', 'viewer'] },
  { title: 'Suppliers', url: '/suppliers', icon: Users, roles: ['admin', 'manager', 'viewer'] },
  { title: 'Orders', url: '/orders', icon: ShoppingCart, roles: ['admin', 'manager', 'viewer'] },
  { title: 'Audit Logs', url: '/audit-logs', icon: FileText, roles: ['admin', 'manager'] },
  { title: 'Import/Export', url: '/import', icon: Upload, roles: ['admin', 'manager'] },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const filteredItems = items.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Inventory System
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t">
          <div className="mb-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{user?.username}</p>
            <p className="text-xs">{user?.role}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
