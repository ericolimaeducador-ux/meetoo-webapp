import { useState, useRef, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Ban, Flag, MoreVertical, Pause } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const convId = window.location.pathname.split("/").pop();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: conversation } = useQuery({
    queryKey: ["conversation", convId],
    queryFn: async () => {
      const convs = await appClient.entities.Conversation.filter({ id: convId });
      return convs[0];
    },
    enabled: !!convId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => appClient.entities.Message.filter({ conversation_id: convId }, "created_at"),
    enabled: !!convId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const msg = await appClient.entities.Message.create({
        conversation_id: convId,
        sender_id: user.id,
        sender_name: user.full_name,
        content: message,
        message_type: "text",
      });
      await appClient.entities.Conversation.update(convId, {
        last_message: message,
        last_message_at: new Date().toISOString(),
      });
      return msg;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", convId] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherPerson = () => {
    if (!conversation || !user) return { name: "...", photo: "" };
    if (conversation.participant_a === user.id) {
      return { name: conversation.participant_b_name, photo: conversation.participant_b_photo };
    }
    return { name: conversation.participant_a_name, photo: conversation.participant_a_photo };
  };

  const other = getOtherPerson();

  const handleBlock = async () => {
    const otherId = conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a;
    await appClient.entities.Block.create({
      blocker_id: user.id,
      blocked_id: otherId,
      blocked_display_name: other.name,
    });
    await appClient.entities.Conversation.update(convId, { status: "blocked" });
    toast.success("Usuário bloqueado");
    navigate("/conversations");
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate();
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-xl">
        <Button variant="ghost" size="icon" onClick={() => navigate("/conversations")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <img
          src={other.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop"}
          alt={other.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{other.name || "Usuário"}</h3>
          <p className="text-xs text-muted-foreground">Conversa aceita</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={handleBlock}>
              <Ban className="w-4 h-4 mr-2" /> Bloquear
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Flag className="w-4 h-4 mr-2" /> Denunciar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pause className="w-4 h-4 mr-2" /> Pausar conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* System message */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground bg-muted/50 inline-block px-4 py-2 rounded-full">
            Agora vocês podem conversar
          </p>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                isMe
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className="rounded-full bg-muted border-0 focus-visible:ring-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
