import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  label: string;
}

export const FeatureCard = ({ icon: Icon, title, description, label }: FeatureCardProps) => {
  return (
    <Card className="relative bg-card border border-border rounded-xl card-hover cursor-pointer">
      <CardContent className="p-6">
        {/* Icon in top right */}
        <div className="absolute top-6 right-6">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        {/* Content */}
        <div className="pr-12 space-y-2">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        
        {/* Label at bottom */}
        <div className="mt-4">
          <span className="feature-label">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
};