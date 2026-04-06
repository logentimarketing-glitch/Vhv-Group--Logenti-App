import "./globals.css";
import type { ReactNode } from "react";
import { Inter, Montserrat, Space_Grotesk } from "next/font/google";
import { getCurrentUser } from "@/lib/session";
import { AppNav } from "@/components/layout/AppNav";
import { OnboardingGate } from "@/components/settings/OnboardingGate";
import { AppRuntime } from "@/components/providers/AppRuntime";
import { getAdminPermissions } from "@/lib/admin-permissions";
import { getUserStatus } from "@/lib/user-status";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vhv-interno.app";

export const metadata = {
  metadataBase: new URL(appUrl),
  title: "VHV Interno",
  description: "Portal web y app para administradores, novatos y trabajadores.",
  manifest: "/manifest.webmanifest",
  themeColor: "#d7a12e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VHV Interno",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const permissions = user?.role === "administrador" ? getAdminPermissions(user) : null;
  const status = getUserStatus(user);
  const themeClass =
    status === "ADMIN"
      ? "app-theme-admin"
      : status === "TRAINEE"
        ? "app-theme-trainee"
        : user
          ? "app-theme-active"
          : "app-theme-public";
  const brandVariant = status === "ADMIN" ? "admin" : "member";

  const sections =
    user?.isMaster
      ? [
          { href: "/home", label: "Inicio" },
          { href: "/dashboard", label: "Control" },
          { href: "/pipeline", label: "Pipeline" },
          { href: "/talent", label: "Personas" },
          { href: "/notifications", label: "Notificaciones" },
          { href: "/messages", label: "Mensajes" },
          { href: "/lms", label: "Cursos" },
          { href: "/community", label: "Novedades" },
          { href: "/settings", label: "Perfil" },
        ]
      : user?.role === "administrador"
        ? [
            { href: "/home", label: "Inicio" },
            { href: "/dashboard", label: "Control" },
            { href: "/pipeline", label: "Pipeline" },
            { href: "/talent", label: "Personas" },
            { href: "/notifications", label: "Notificaciones" },
            { href: "/messages", label: "Mensajes" },
            { href: "/lms", label: "Cursos" },
            { href: "/community", label: "Novedades" },
            { href: "/settings", label: "Perfil" },
          ]
        : status === "TRAINEE"
          ? [
              { href: "/community", label: "Novedades" },
              { href: "/lms", label: "Espacio" },
              { href: "/home", label: "Mi espacio", locked: true },
              { href: "/settings", label: "Perfil", locked: true },
              { href: "/notifications", label: "Notificaciones" },
              { href: "/support", label: "Soporte tecnico" },
              { href: "/logout", label: "Cerrar sesion", kind: "logout" as const },
            ]
          : user
            ? [
                { href: "/community", label: "Novedades" },
                { href: "/home", label: "Mi espacio" },
                { href: "/lms", label: "Clases" },
                { href: "/notifications", label: "Notificaciones" },
                { href: "/messages", label: "Mensajes" },
                { href: "/settings", label: "Perfil" },
                { href: "/support", label: "Soporte tecnico" },
              ]
            : [
                { href: "/", label: "Inicio" },
                { href: "/login", label: "Login" },
              ];

  return (
    <html lang="es">
      <body className={`${inter.variable} ${montserrat.variable} ${spaceGrotesk.variable}`}>
        <div className={`site-shell ${themeClass}`}>
          <AppNav
            key={brandVariant}
            sections={sections}
            authenticated={Boolean(user)}
            user={user}
            brandVariant={brandVariant}
          />
          <AppRuntime user={user}>
            <OnboardingGate user={user}>
              <main className="page-wrap">{children}</main>
            </OnboardingGate>
          </AppRuntime>
        </div>
      </body>
    </html>
  );
}
