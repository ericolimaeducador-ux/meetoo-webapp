import { MapPin } from "lucide-react";

export default function MeetooLogo({ size = "md", showText = true }) {
  const sizes = {
    sm: { icon: "w-5 h-5", text: "text-lg" },
    md: { icon: "w-7 h-7", text: "text-2xl" },
    lg: { icon: "w-10 h-10", text: "text-4xl" },
    xl: { icon: "w-14 h-14", text: "text-5xl" },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <MapPin className={`${s.icon} text-primary`} strokeWidth={2.5} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
        </div>
      </div>
      {showText && (
        <span className={`${s.text} font-serif font-bold tracking-tight text-foreground`}>
          Mee<span className="text-primary">too</span>
        </span>
      )}
    </div>
  );
}
