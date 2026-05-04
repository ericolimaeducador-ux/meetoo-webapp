import { ShieldCheck, CheckCircle2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const badges = {
  verified: {
    label: "Verificado",
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary border-primary/20",
    tooltip: "Perfil verificado com foto e identidade"
  },
  verified_plus: {
    label: "Verificado Plus",
    icon: ShieldCheck,
    className: "bg-secondary/10 text-secondary border-secondary/20",
    tooltip: "Verificação completa com prova de vida"
  },
  photo_confirmed: {
    label: "Foto Confirmada",
    icon: CheckCircle2,
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    tooltip: "Foto real confirmada"
  },
  identity_consistent: {
    label: "Identidade Consistente",
    icon: Star,
    className: "bg-secondary/10 text-secondary border-secondary/20",
    tooltip: "Identidade verificada como consistente"
  },
};

export default function VerificationBadge({ status, compact = false }) {
  const config = badges[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={`${config.className} border gap-1 font-medium`}>
            <Icon className="w-3 h-3" />
            {!compact && <span className="text-xs">{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
