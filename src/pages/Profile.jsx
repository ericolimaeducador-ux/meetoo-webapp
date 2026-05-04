import { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Plus, X, Save, Settings, Shield, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import MeetooLogo from "@/components/shared/MeetooLogo";
import VerificationBadge from "@/components/shared/VerificationBadge";
import { toast } from "sonner";

const INTEREST_OPTIONS = [
  "Viagem", "Música", "Cinema", "Gastronomia", "Esportes", "Leitura",
  "Arte", "Tecnologia", "Natureza", "Yoga", "Fotografia", "Dança",
  "Vinhos", "Café", "Pets", "Meditação", "Corrida", "Culinária",
];

export default function Profile() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    display_name: "",
    birth_date: "",
    gender: "",
    city: "",
    bio: "",
    intent: "",
    lifestyle: "",
    interests: [],
    is_visible: true,
    is_invisible: false,
    show_age_range: false,
    search_radius_km: 10,
    preferred_gender: "everyone",
    preferred_age_min: 18,
    preferred_age_max: 60,
  });

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const u = await appClient.auth.me();
      const profiles = await appClient.entities.Profile.filter({ user_id: u.id });
      return profiles[0] || null;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        birth_date: profile.birth_date || "",
        gender: profile.gender || "",
        city: profile.city || "",
        bio: profile.bio || "",
        intent: profile.intent || "",
        lifestyle: profile.lifestyle || "",
        interests: profile.interests || [],
        is_visible: profile.is_visible ?? true,
        is_invisible: profile.is_invisible ?? false,
        show_age_range: profile.show_age_range ?? false,
        search_radius_km: profile.search_radius_km || 10,
        preferred_gender: profile.preferred_gender || "everyone",
        preferred_age_min: profile.preferred_age_min || 18,
        preferred_age_max: profile.preferred_age_max || 60,
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (profile) {
        return appClient.entities.Profile.update(profile.id, form);
      } else {
        return appClient.entities.Profile.create({
          ...form,
          user_id: user.id,
          verification_status: "pending",
          is_online: false,
          onboarding_complete: true,
        });
      }
    },
    onSuccess: () => {
      toast.success("Perfil salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await appClient.integrations.Core.UploadFile({ file });
    const currentPhotos = profile?.photos || [];
    if (profile) {
      await appClient.entities.Profile.update(profile.id, { photos: [...currentPhotos, file_url] });
    }
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    toast.success("Foto adicionada!");
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold">Meu perfil</h1>
        <div className="flex gap-2">
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Verification status */}
      {profile && (
        <div className="mb-6">
          <VerificationBadge status={profile.verification_status} />
        </div>
      )}

      {/* Photos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(profile?.photos || []).map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <div className="text-center">
                <Camera className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Adicionar</span>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Informações básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Nome</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Seu nome" />
          </div>
          <div>
            <Label className="text-sm">Data de nascimento</Label>
            <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm">Gênero</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="non_binary">Não-binário</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Cidade</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Sua cidade" />
          </div>
        </CardContent>
      </Card>

      {/* Bio & intent */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Sobre você</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Mini bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Conte um pouco sobre você..." rows={3} />
          </div>
          <div>
            <Label className="text-sm">Intenção</Label>
            <Select value={form.intent} onValueChange={(v) => setForm({ ...form, intent: v })}>
              <SelectTrigger><SelectValue placeholder="O que você busca?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="friendship">Amizade</SelectItem>
                <SelectItem value="meet_people">Conhecer pessoas</SelectItem>
                <SelectItem value="serious_relationship">Relacionamento sério</SelectItem>
                <SelectItem value="casual_dates">Encontros leves</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Estilo de vida</Label>
            <Input value={form.lifestyle} onChange={(e) => setForm({ ...form, lifestyle: e.target.value })} placeholder="Ex: Ativo, gosto de viajar..." />
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Interesses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <Badge
                key={interest}
                variant={form.interests.includes(interest) ? "default" : "outline"}
                className={`cursor-pointer rounded-full px-3 py-1 transition-all ${
                  form.interests.includes(interest) ? "bg-primary hover:bg-primary/90" : "hover:border-primary/50"
                }`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Perfil visível na descoberta</Label>
            <Switch checked={form.is_visible} onCheckedChange={(v) => setForm({ ...form, is_visible: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Modo invisível</Label>
            <Switch checked={form.is_invisible} onCheckedChange={(v) => setForm({ ...form, is_invisible: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Mostrar faixa etária ao invés de idade</Label>
            <Switch checked={form.show_age_range} onCheckedChange={(v) => setForm({ ...form, show_age_range: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full rounded-full bg-primary hover:bg-primary/90 h-12"
      >
        <Save className="w-4 h-4 mr-2" />
        Salvar perfil
      </Button>

      {/* Logout */}
      <Button
        variant="ghost"
        onClick={() => appClient.auth.logout()}
        className="w-full mt-3 rounded-full text-muted-foreground"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}
