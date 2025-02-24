
import { Card } from "@/components/ui/card";

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12 animate-slide-up-fade">
      {[
        {
          title: "Rastreamento em Tempo Real",
          description: "Acompanhe sua corrida em tempo real com atualizações GPS",
        },
        {
          title: "Corridas Seguras",
          description: "Motoristas verificados e recursos de segurança",
        },
        {
          title: "Suporte 24/7",
          description: "Atendimento ao cliente 24 horas para sua tranquilidade",
        },
      ].map((feature, index) => (
        <Card key={index} className="p-6 text-center glass-effect">
          <h3 className="font-semibold mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">
            {feature.description}
          </p>
        </Card>
      ))}
    </div>
  );
}
