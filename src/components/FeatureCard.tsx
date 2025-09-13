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
        {/* Label */}
        <div className="absolute top-4 right-4">
          <span className="feature-label">{label}</span>
        </div>

        {/* Icon */}
        <div className="mb-4">
          <div className="w-12 h-12 rounded-lg border-2 border-primary/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};