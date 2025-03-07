
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MapTypeSelectorProps {
  onChange: (mapType: google.maps.MapTypeId) => void;
}

export const MapTypeSelector = ({ onChange }: MapTypeSelectorProps) => {
  return (
    <div className="absolute top-4 left-4 z-20">
      <Tabs defaultValue="roadmap" onValueChange={(value) => onChange(value as google.maps.MapTypeId)}>
        <TabsList className="bg-background/80 backdrop-blur-sm">
          <TabsTrigger value="roadmap">Padrão</TabsTrigger>
          <TabsTrigger value="satellite">Satélite</TabsTrigger>
          <TabsTrigger value="hybrid">Híbrido</TabsTrigger>
          <TabsTrigger value="terrain">Terreno</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
