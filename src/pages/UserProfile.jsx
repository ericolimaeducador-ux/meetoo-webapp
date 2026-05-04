import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageCircle, Flag, Ban, MapPin, Heart, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import VerificationBadge from "@/components/shared/VerificationBadge";
import OnlineBadge from "@/components/shared/OnlineBadge";
import { toast } from "sonner";

const intentLabels = {
  friendship: "Amizade",
  meet_people: "Conhecer pessoas",
  serious_relationship: "Relacionamento sério",
  casual_dates: "Encontros leves",
};

function getAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileId = new URLSearchParams(window.location.search).get("id") || window.location.pathname.split("/").pop();
  
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", profileId],
    queryFn: async () => {
      const profiles = await appClient.entities.Profile.filter({ id: profileId });
      return profiles[0];
    },
    enabled: !!profileId,
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const user = await appClient.auth.me();
      const profiles = await appClient.entities.Profile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const user = await appClient.auth.me();
      return appClient.entities.ConversationRequest.create({
        from_user_id: user.id,
        from_display_name: myProfile?.display_name || user.full_name,
        from_photo: myProfile?.photos?.[0] || "",
        to_user_id: profile.user_id,
        to_display_name: profile.display_name,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast.success("Solicitação enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const user = await appClient.auth.me();
      return appClient.entities.Block.create({
        blocker_id: user.id,
        blocked_id: profile.user_id,
        blocked_display_name: profile.display_name,
      });
    },
    onSuccess: () => {
      toast.success("Usuário bloqueado");
      navigate("/discover");
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const user = await appClient.auth.me();
      return appClient.entities.Report.create({
        reporter_id: user.id,
        reported_user_id: profile.user_id,
        reported_display_name: profile.display_name,
        reason: reportReason,
        details: reportDetails,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast.success("Denúncia enviada. Analisaremos em breve.");
      setShowReportDialog(false);
    },
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const age = getAge(profile.birth_date);
  const photos = profile.photos || [];

  return (
    <div className="pb-8">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Photo */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
        <img
          src={photos[0] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&h=800&fit=crop"}
          alt={profile.display_name}
          className="w-full aspect-[3/4] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </motion.div>

      {/* Info */}
      <div className="px-5 -mt-20 relative z-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">
              {profile.display_name}{age ? `, ${age}` : ""}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <OnlineBadge isOnline={profile.is_online} />
              <div className="flex items-center gap-1 text-white/80">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-sm">{profile.city || "Próximo(a)"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.verification_status && profile.verification_status !== "pending" && (
            <VerificationBadge status={profile.verification_status} />
          )}
          {profile.photo_confirmed && <VerificationBadge status="photo_confirmed" />}
          {profile.identity_consistent && <VerificationBadge status="identity_consistent" />}
        </div>

        {/* Intent */}
        {profile.intent && (
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{intentLabels[profile.intent]}</span>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Sobre</h3>
            <p className="text-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Interesses</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="rounded-full px-3 py-1">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle */}
        {profile.lifestyle && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Estilo de vida</h3>
            <p className="text-foreground text-sm">{profile.lifestyle}</p>
          </div>
        )}

        {/* More photos */}
        {photos.length > 1 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Fotos</h3>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(1).map((photo, i) => (
                <img key={i} src={photo} alt="" className="w-full aspect-square object-cover rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending}
            className="w-full rounded-full bg-primary hover:bg-primary/90 h-13 text-base shadow-lg shadow-primary/20"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Quero conversar
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(true)}
              className="flex-1 rounded-full"
            >
              <Flag className="w-4 h-4 mr-2" />
              Denunciar
            </Button>
            <Button
              variant="outline"
              onClick={() => blockMutation.mutate()}
              className="flex-1 rounded-full text-destructive hover:text-destructive"
            >
              <Ban className="w-4 h-4 mr-2" />
              Bloquear
            </Button>
          </div>
        </div>
      </div>

      {/* Report dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Denunciar perfil</DialogTitle>
            <DialogDescription>
              Sua denúncia será analisada pela equipe de moderação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Motivo da denúncia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fake_profile">Perfil falso</SelectItem>
                <SelectItem value="inappropriate_photo">Foto inadequada</SelectItem>
                <SelectItem value="harassment">Assédio</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="underage">Menor de idade</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Detalhes adicionais (opcional)"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
            <Button
              onClick={() => reportMutation.mutate()}
              disabled={!reportReason || reportMutation.isPending}
              className="w-full rounded-full bg-destructive hover:bg-destructive/90"
            >
              Enviar denúncia
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
