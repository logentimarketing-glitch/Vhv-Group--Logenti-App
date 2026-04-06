"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUnreadNotificationsCount, readNotifications } from "@/lib/notifications";

type Section = {
  href: string;
  label: string;
  locked?: boolean;
  kind?: "link" | "logout";
};

type AppNavProps = {
  sections: Section[];
  authenticated: boolean;
  user: {
    matricula?: string;
    role: "administrador" | "novato" | "usuario";
    isMaster?: boolean;
  } | null;
  brandVariant: "admin" | "member";
};

export function AppNav({ sections, authenticated, user, brandVariant }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const adminView = brandVariant === "admin";

  const logo = adminView
    ? {
        src: "/branding/vhv-group.png",
        alt: "VHV Group",
        width: 150,
        height: 150,
        className: "app-brand-logo app-brand-logo-vhv",
      }
    : {
        src: "/branding/logenti.png",
        alt: "Logenti",
        width: 248,
        height: 72,
        className: "app-brand-logo app-brand-logo-logenti",
      };

  useEffect(() => {
    const syncNotifications = () => {
      try {
        const notifications = readNotifications();
        setPendingApprovals(
          user?.isMaster
            ? notifications.filter((item) => item.kind === "moderation").length
            : 0,
        );
        setNotificationCount(user?.matricula ? getUnreadNotificationsCount(user.matricula) : 0);
      } catch {
        setPendingApprovals(0);
        setNotificationCount(0);
      }
    };

    syncNotifications();
    window.addEventListener("storage", syncNotifications);
    return () => window.removeEventListener("storage", syncNotifications);
  }, [user?.isMaster, user?.matricula]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const primaryMobileSections = sections.filter((section) => section.kind !== "logout").slice(0, 5);

  return (
    <>
      <header className={`app-header ${adminView ? "app-header-admin" : "app-header-member"}`}>
        <div className="app-header-main">
          <div className="app-brand-block">
            <Link href="/" className="app-brand-link">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className={`${logo.className} app-brand-logo-white`}
                priority
              />
            </Link>
          </div>

          {authenticated ? (
            <button
              type="button"
              className="app-header-menu-toggle"
              aria-expanded={menuOpen}
              aria-label="Abrir navegacion"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
          ) : null}
        </div>

        <div className={`app-header-nav-shell ${menuOpen ? "open" : ""}`}>
          <nav className="topnav topnav-app">
            {sections.map((section) => {
              if (section.kind === "logout") {
                return (
                  <button
                    key={section.href}
                    type="button"
                    className="topnav-logout"
                    onClick={handleLogout}
                  >
                    <span className="topnav-link-content">{section.label}</span>
                  </button>
                );
              }

              const active =
                pathname === section.href ||
                (section.href !== "/" && pathname.startsWith(`${section.href}/`));

              if (section.locked) {
                return (
                  <button
                    key={section.href}
                    type="button"
                    className="topnav-locked"
                    disabled
                    title="Complete your training to unlock this feature"
                  >
                    <span className="topnav-link-content">
                      <span aria-hidden="true">🔒</span>
                      {section.label}
                    </span>
                  </button>
                );
              }

              const showBadge =
                (user?.isMaster && section.href === "/community" && pendingApprovals > 0) ||
                (section.href === "/notifications" && notificationCount > 0);

              const badgeValue =
                section.href === "/notifications" ? notificationCount : pendingApprovals;

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={active ? "topnav-active" : ""}
                >
                  <span className="topnav-link-content">
                    {section.label}
                    {showBadge ? <span className="topnav-badge">{badgeValue}</span> : null}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {authenticated ? (
        <nav className={`mobile-bottom-nav ${adminView ? "mobile-bottom-nav-admin" : ""}`}>
          {primaryMobileSections.map((section) => {
            const active =
              pathname === section.href ||
              (section.href !== "/" && pathname.startsWith(`${section.href}/`));

            if (section.locked) {
              return (
                <button
                  key={section.href}
                  type="button"
                  className="mobile-bottom-item mobile-bottom-item-locked"
                  disabled
                  title="Complete your training to unlock this feature"
                >
                  <span className="mobile-bottom-icon" aria-hidden="true">
                    🔒
                  </span>
                  <span>{section.label}</span>
                </button>
              );
            }

            const badge =
              section.href === "/notifications" && notificationCount > 0 ? notificationCount : 0;

            return (
              <Link
                key={section.href}
                href={section.href}
                className={`mobile-bottom-item ${active ? "active" : ""}`}
              >
                <span className="mobile-bottom-icon" aria-hidden="true">
                  {getMobileIcon(section.href)}
                </span>
                <span>{section.label}</span>
                {badge ? <span className="topnav-badge">{badge}</span> : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}

function getMobileIcon(href: string) {
  if (href.includes("/community")) return "◉";
  if (href.includes("/home")) return "⌂";
  if (href.includes("/lms")) return "▣";
  if (href.includes("/messages")) return "✉";
  if (href.includes("/notifications")) return "🔔";
  if (href.includes("/settings")) return "◎";
  if (href.includes("/dashboard")) return "◫";
  if (href.includes("/pipeline")) return "⋮";
  if (href.includes("/talent")) return "◌";
  if (href.includes("/support")) return "?";
  return "•";
}
