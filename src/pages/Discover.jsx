import { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import MeetooLogo from "@/components/shared/MeetooLogo";
import ProfileCard from "@/components/discovery/ProfileCard";
import DiscoveryFilters from "@/components/discovery/DiscoveryFilters";
import { MapPin, Radio } from "lucide-react";

export default function Discover() {
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(false);
  const [radius, setRadius] = useState(10);
  const [filters, setFilters] = useState({
    radius: 10,
    ageMin: 18,
    ageMax: 60,
    intent: "all",
    gender: "everyone",
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const user = await appClient.auth.me();
      const profiles = await appClient.entities.Profile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["discover-profiles", filters],
    queryFn: () => appClient.entities.Profile.filter({ is_online: true, is_visible: true }),
  });

  // Toggle availability
  const handleToggleAvailable = async (checked) => {
    setIsAvailable(checked);
    if (myProfile) {
      await appClient.entities.Profile.update(myProfile.id, {
        is_online: checked,
        last_online: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    if (myProfile) {
      setIsAvailable(myProfile.is_online || false);
      setRadius(myProfile.search_radius_km || 10);
    }
  }, [myProfile]);

  const filteredProfiles = profiles.filter((p) => {
    if (myProfile && p.user_id === myProfile.user_id) return false;
    return true;
  });

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <MeetooLogo size="sm" />
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            isAvailable ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
          }`}>
            <Radio className="w-3.5 h-3.5" />
            {isAvailable ? "Disponível" : "Offline"}
          </div>
          <Switch checked={isAvailable} onCheckedChange={handleToggleAvailable} />
        </div>
      </div>

      {/* Radius control */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <Label className="text-sm font-medium">Raio de descoberta</Label>
          </div>
          <span className="text-sm font-semibold text-primary">{radius} km</span>
        </div>
        <Slider
          value={[radius]}
          onValueChange={([v]) => setRadius(v)}
          min={1}
          max={100}
          step={1}
        />
      </div>

      {/* Title + Filters */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-serif font-bold">Pessoas verificadas</h1>
          <p className="text-sm text-muted-foreground">por perto e disponíveis agora</p>
        </div>
        <DiscoveryFilters filters={filters} onApply={setFilters} />
      </div>

      {/* Profile grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <Skeleton className="aspect-[3/4]" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Ninguém disponível agora</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ative seu status "Disponível" e aguarde. Pessoas verificadas aparecerão quando estiverem online.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onClick={() => navigate(`/user/${profile.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
