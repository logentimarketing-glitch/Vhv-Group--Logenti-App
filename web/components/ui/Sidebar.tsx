import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/lms", label: "Clases" },
  { href: "/community", label: "Novedades" },
  { href: "/marketing", label: "Marketing" },
  { href: "/settings", label: "Perfiles" },
];

export function Sidebar() {
  return (
    <aside className="panel">
      <div className="stack-sm">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="text-link">
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
