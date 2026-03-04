"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Channels", href: "/channels", icon: Users },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const [easterEgg, setEasterEgg] = useState(false);
  const clickCount = useRef(0);

  function handleLogoClick() {
    clickCount.current += 1;
    if (clickCount.current >= 7) {
      setEasterEgg(true);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Ivymental"
            width={50}
            height={50}
            onClick={(e) => {
              e.preventDefault();
              handleLogoClick();
            }}
          />
          <span className="text-lg font-semibold">Ivymental</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {easterEgg && (
        <SidebarFooter className="px-4 pb-4">
          <p className="text-xs text-muted-foreground italic">
            Built with late nights, bad jokes, and way too much energy drinks by Ivy
            &amp; Kelly, who still can&apos;t agree on which channel has
            the best vibes. 💚
          </p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
