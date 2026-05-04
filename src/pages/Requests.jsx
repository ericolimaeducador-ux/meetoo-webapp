import { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Ban, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

function RequestCard({ request, onAccept, onDecline, onBlock, isIncoming }) {
  const photo = isIncoming ? request.from_photo : request.to_display_name;
  const name = isIncoming ? request.from_display_name : request.to_display_name;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50"
    >
      <img
        src={request.from_photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"}
        alt={name}
        className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{name}</h3>
        <p className="text-sm text-muted-foreground">
          {isIncoming ? "Quer conversar com você" : `Status: ${request.status}`}
        </p>
      </div>
      {isIncoming && request.status === "pending" && (
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => onBlock(request)} className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10">
            <Ban className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDecline(request)} className="rounded-full">
            <X className="w-4 h-4" />
          </Button>
          <Button size="icon" onClick={() => onAccept(request)} className="rounded-full bg-primary hover:bg-primary/90">
            <Check className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function Requests() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: incoming = [], isLoading: loadingIn } = useQuery({
    queryKey: ["requests-incoming", user?.id],
    queryFn: () => appClient.entities.ConversationRequest.filter({ to_user_id: user.id, status: "pending" }),
    enabled: !!user,
  });

  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ["requests-sent", user?.id],
    queryFn: () => appClient.entities.ConversationRequest.filter({ from_user_id: user.id }),
    enabled: !!user,
  });

  const acceptMutation = useMutation({
    mutationFn: async (request) => {
      await appClient.entities.ConversationRequest.update(request.id, { status: "accepted" });
      await appClient.entities.Conversation.create({
        participant_a: request.from_user_id,
        participant_b: request.to_user_id,
        participant_a_name: request.from_display_name,
        participant_b_name: request.to_display_name,
        participant_a_photo: request.from_photo,
        status: "active",
        request_id: request.id,
      });
    },
    onSuccess: () => {
      toast.success("Conversa aceita! Agora vocês podem conversar.");
      queryClient.invalidateQueries({ queryKey: ["requests-incoming"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (request) => appClient.entities.ConversationRequest.update(request.id, { status: "declined" }),
    onSuccess: () => {
      toast("Solicitação recusada");
      queryClient.invalidateQueries({ queryKey: ["requests-incoming"] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (request) => {
      await appClient.entities.ConversationRequest.update(request.id, { status: "blocked" });
      await appClient.entities.Block.create({
        blocker_id: user.id,
        blocked_id: request.from_user_id,
        blocked_display_name: request.from_display_name,
      });
    },
    onSuccess: () => {
      toast.success("Usuário bloqueado");
      queryClient.invalidateQueries({ queryKey: ["requests-incoming"] });
    },
  });

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-serif font-bold mb-6">Solicitações</h1>

      <Tabs defaultValue="incoming">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="incoming" className="flex-1">
            Recebidas {incoming.length > 0 && `(${incoming.length})`}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1">
            Enviadas {sent.length > 0 && `(${sent.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <AnimatePresence>
            {incoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Nenhuma solicitação</h3>
                <p className="text-sm text-muted-foreground">
                  Quando alguém quiser conversar, aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incoming.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    isIncoming
                    onAccept={(r) => acceptMutation.mutate(r)}
                    onDecline={(r) => declineMutation.mutate(r)}
                    onBlock={(r) => blockMutation.mutate(r)}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="sent">
          {sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Nenhuma solicitação enviada</h3>
              <p className="text-sm text-muted-foreground">
                Explore perfis e solicite conversa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sent.map((req) => (
                <RequestCard key={req.id} request={req} isIncoming={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
