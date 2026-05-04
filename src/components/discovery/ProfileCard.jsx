import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import VerificationBadge from "../shared/VerificationBadge";
import OnlineBadge from "../shared/OnlineBadge";

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

export default function ProfileCard({ profile, onClick }) {
  const age = getAge(profile.birth_date);
  const mainPhoto = profile.photos?.[0] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative rounded-2xl overflow-hidden bg-card shadow-sm border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
        {/* Photo */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={mainPhoto}
            alt={profile.display_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {/* Online badge */}
          <div className="absolute top-3 left-3">
            <OnlineBadge isOnline={profile.is_online} />
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg leading-tight">
                  {profile.display_name}{age ? `, ${age}` : ""}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-white/80">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{profile.city || "Próximo(a)"}</span>
                </div>
              </div>
            </div>
            
            {profile.verification_status && profile.verification_status !== "pending" && (
              <div className="mt-2">
                <VerificationBadge status={profile.verification_status} compact />
              </div>
            )}
          </div>
        </div>

        {/* Bottom info */}
        <div className="p-3">
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{profile.bio}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {profile.intent && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">
                {intentLabels[profile.intent] || profile.intent}
              </span>
            )}
            {profile.interests?.slice(0, 2).map((interest) => (
              <span key={interest} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
