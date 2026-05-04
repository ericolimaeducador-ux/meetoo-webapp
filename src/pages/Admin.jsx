import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Flag, Users, Ban, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pendingProfiles = [] } = useQuery({
    queryKey: ["admin-pending-profiles"],
    queryFn: () => appClient.entities.Profile.filter({ verification_status: "pending" }),
  });

  const { data: underReview = [] } = useQuery({
    queryKey: ["admin-review-profiles"],
    queryFn: () => appClient.entities.Profile.filter({ verification_status: "under_review" }),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => appClient.entities.Report.filter({ status: "pending" }),
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-all-profiles"],
    queryFn: () => appClient.entities.Profile.list("-created_at", 50),
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["admin-blocks"],
    queryFn: () => appClient.entities.Block.list("-created_at", 50),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }) => appClient.entities.Profile.update(id, { verification_status: status }),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-review-profiles"] });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, status, notes }) => appClient.entities.Report.update(id, { status, resolution_notes: notes }),
    onSuccess: () => {
      toast.success("Denúncia processada");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Moderação e confiança</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard title="Perfis totais" value={allProfiles.length} icon={Users} color="bg-primary/10 text-primary" />
          <StatCard title="Pendentes" value={pendingProfiles.length} icon={Eye} color="bg-secondary/10 text-secondary" />
          <StatCard title="Denúncias" value={reports.length} icon={Flag} color="bg-destructive/10 text-destructive" />
          <StatCard title="Bloqueios" value={blocks.length} icon={Ban} color="bg-muted text-muted-foreground" />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Perfis pendentes ({pendingProfiles.length})</TabsTrigger>
            <TabsTrigger value="reports">Denúncias ({reports.length})</TabsTrigger>
            <TabsTrigger value="review">Em revisão ({underReview.length})</TabsTrigger>
          </TabsList>

          {/* Pending profiles */}
          <TabsContent value="pending">
            <div className="space-y-3">
              {pendingProfiles.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum perfil pendente</p>
              )}
              {pendingProfiles.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <img
                      src={p.photos?.[0] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop"}
                      alt={p.display_name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{p.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{p.city} • {p.bio?.slice(0, 50)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate({ id: p.id, status: "under_review" })} className="rounded-full">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Revisar
                      </Button>
                      <Button size="sm" onClick={() => verifyMutation.mutate({ id: p.id, status: "verified" })} className="rounded-full bg-primary">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => verifyMutation.mutate({ id: p.id, status: "rejected" })} className="rounded-full">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <div className="space-y-3">
              {reports.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma denúncia pendente</p>
              )}
              {reports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">Denúncia contra {r.reported_display_name}</h3>
                        <Badge variant="outline" className="mt-1 capitalize">{r.reason?.replace(/_/g, " ")}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.details && <p className="text-sm text-muted-foreground mb-3">{r.details}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => resolveReportMutation.mutate({ id: r.id, status: "resolved", notes: "Ação tomada" })} className="rounded-full bg-primary">
                        Resolver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => resolveReportMutation.mutate({ id: r.id, status: "dismissed", notes: "Sem evidência" })} className="rounded-full">
                        Dispensar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Under review */}
          <TabsContent value="review">
            <div className="space-y-3">
              {underReview.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum perfil em revisão</p>
              )}
              {underReview.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <img
                      src={p.photos?.[0] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop"}
                      alt={p.display_name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{p.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{p.city}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => verifyMutation.mutate({ id: p.id, status: "verified" })} className="rounded-full bg-primary">
                        Aprovar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => verifyMutation.mutate({ id: p.id, status: "rejected" })} className="rounded-full">
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
