import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Conversations() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        appClient.entities.Conversation.filter({ participant_a: user.id, status: "active" }),
        appClient.entities.Conversation.filter({ participant_b: user.id, status: "active" }),
      ]);
      return [...a, ...b].sort((x, y) => 
        new Date(y.last_message_at || y.created_at) - new Date(x.last_message_at || x.created_at)
      );
    },
    enabled: !!user,
  });

  const getOtherPerson = (conv) => {
    if (conv.participant_a === user?.id) {
      return { name: conv.participant_b_name, photo: conv.participant_b_photo };
    }
    return { name: conv.participant_a_name, photo: conv.participant_a_photo };
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-serif font-bold mb-6">Conversas</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Nenhuma conversa ainda</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Quando alguém aceitar sua solicitação de conversa, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv, i) => {
            const other = getOtherPerson(conv);
            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50 cursor-pointer hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <img
                  src={other.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
                  alt={other.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{other.name || "Usuário"}</h3>
                    {conv.last_message_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.last_message_at), "HH:mm")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conv.last_message || "Agora vocês podem conversar"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
