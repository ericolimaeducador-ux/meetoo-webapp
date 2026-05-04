import { Link, useLocation } from "react-router-dom";
import { Compass, MessageCircle, Inbox, User, Shield } from "lucide-react";

const navItems = [
  { path: "/discover", icon: Compass, label: "Descobrir" },
  { path: "/requests", icon: Inbox, label: "Solicitações" },
  { path: "/conversations", icon: MessageCircle, label: "Conversas" },
  { path: "/profile", icon: User, label: "Perfil" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
