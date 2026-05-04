import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function DiscoveryFilters({ filters, onApply }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl">Filtros de descoberta</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          {/* Distance */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Distância máxima</Label>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>1 km</span>
              <span className="font-semibold text-foreground">{localFilters.radius} km</span>
              <span>100 km</span>
            </div>
            <Slider
              value={[localFilters.radius]}
              onValueChange={([v]) => setLocalFilters({ ...localFilters, radius: v })}
              min={1}
              max={100}
              step={1}
              className="py-2"
            />
          </div>

          {/* Age range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Faixa etária</Label>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{localFilters.ageMin} anos</span>
              <span>{localFilters.ageMax} anos</span>
            </div>
            <div className="flex gap-4">
              <Slider
                value={[localFilters.ageMin]}
                onValueChange={([v]) => setLocalFilters({ ...localFilters, ageMin: v })}
                min={18}
                max={80}
                step={1}
              />
              <Slider
                value={[localFilters.ageMax]}
                onValueChange={([v]) => setLocalFilters({ ...localFilters, ageMax: v })}
                min={18}
                max={80}
                step={1}
              />
            </div>
          </div>

          {/* Intent */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Intenção</Label>
            <Select
              value={localFilters.intent}
              onValueChange={(v) => setLocalFilters({ ...localFilters, intent: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer intenção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer intenção</SelectItem>
                <SelectItem value="friendship">Amizade</SelectItem>
                <SelectItem value="meet_people">Conhecer pessoas</SelectItem>
                <SelectItem value="serious_relationship">Relacionamento sério</SelectItem>
                <SelectItem value="casual_dates">Encontros leves</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mostrar</Label>
            <Select
              value={localFilters.gender}
              onValueChange={(v) => setLocalFilters({ ...localFilters, gender: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Todos</SelectItem>
                <SelectItem value="male">Homens</SelectItem>
                <SelectItem value="female">Mulheres</SelectItem>
                <SelectItem value="non_binary">Não-binário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleApply} className="w-full rounded-full bg-primary hover:bg-primary/90">
            Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
