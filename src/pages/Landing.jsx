import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import MeetooLogo from "@/components/shared/MeetooLogo";
import { ShieldCheck, MapPin, MessageCircle, Eye, Heart, Users } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Identidade verificada",
    description: "Somente perfis reais com foto confirmada e validação de identidade.",
  },
  {
    icon: MapPin,
    title: "Pessoas por perto",
    description: "Descubra quem está disponível agora no seu raio, sem expor localização exata.",
  },
  {
    icon: MessageCircle,
    title: "Conversa por aceite",
    description: "Ninguém te envia mensagem sem sua permissão. Converse com intenção.",
  },
  {
    icon: Eye,
    title: "Privacidade por padrão",
    description: "Você controla quando está visível, quem pode te encontrar e seus dados.",
  },
];

const values = [
  { icon: Heart, label: "Confiança" },
  { icon: Users, label: "Presença real" },
  { icon: ShieldCheck, label: "Consentimento" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <MeetooLogo size="md" />
          <Link to="/discover">
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 px-6">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Descoberta local consentida
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight leading-tight">
              Conexões reais,
              <br />
              <span className="text-primary">por perto.</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Meetoo não é sobre aparecer para todo mundo. É sobre estar disponível para alguém certo, por perto, com segurança.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/discover">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10 text-base h-13 shadow-lg shadow-primary/20">
                  Começar agora
                </Button>
              </Link>
            </div>

            {/* Trust values */}
            <div className="mt-12 flex items-center justify-center gap-8">
              {values.map((v) => (
                <div key={v.label} className="flex items-center gap-2 text-muted-foreground">
                  <v.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{v.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold text-center mb-4"
          >
            Presença real. Pessoas reais.
          </motion.h2>
          <p className="text-center text-muted-foreground mb-16 max-w-lg mx-auto">
            Encontre com segurança. Converse com intenção.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Local, seguro, consentido.</h2>
          <p className="text-muted-foreground mb-8">
            Junte-se a pessoas que valorizam conexões reais, com respeito e intenção.
          </p>
          <Link to="/discover">
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 px-10">
              Criar minha conta
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
