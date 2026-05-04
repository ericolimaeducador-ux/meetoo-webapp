import { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Shield, MapPin, Eye, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const u = await appClient.auth.me();
      const profiles = await appClient.entities.Profile.filter({ user_id: u.id });
      return profiles[0] || null;
    },
  });

  const handleDeleteAccount = async () => {
    if (profile) {
      await appClient.entities.Profile.delete(profile.id);
    }
    toast.success("Conta e dados removidos. Até logo.");
    appClient.auth.logout("/");
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-serif font-bold">Configurações</h1>
      </div>

      {/* Security */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">E-mail</p>
            <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Status de verificação</p>
            <p className="text-sm text-muted-foreground capitalize">{profile?.verification_status || "Pendente"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Localização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sua localização exata nunca é exibida para outros usuários. Mostramos apenas distância aproximada.
          </p>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Consentimento por camadas</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-5">
              <li>• Usar localização para descobrir pessoas próximas</li>
              <li>• Mostrar apenas distância aproximada</li>
              <li>• Permitir ser encontrado enquanto online</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Você controla quando está visível, quem pode te encontrar e seus dados. Acesse seu perfil para ajustar configurações de visibilidade.
          </p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash2 className="w-4 h-4" /> Zona perigosa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
          </p>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="rounded-full">
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Excluir conta</DialogTitle>
            <DialogDescription>
              Essa ação é irreversível. Todos os seus dados, conversas e fotos serão permanentemente removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} className="rounded-full">
              Sim, excluir tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
