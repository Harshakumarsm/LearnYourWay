import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, Clock, Globe } from "lucide-react";
import { Resource } from "@/services/api";

interface ResourceCardProps {
  resource: Resource;
  onOpenLink: (url: string) => void;
}

const getResourceIcon = (type: Resource['type']) => {
  switch (type) {
    case 'article':
      return '📄';
    case 'docs':
      return '📚';
    case 'tutorial':
      return '🎓';
    case 'video':
      return '🎥';
    case 'blog':
      return '✍️';
    default:
      return '📄';
  }
};

const getResourceColor = (type: Resource['type']) => {
  switch (type) {
    case 'article':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'docs':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'tutorial':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'video':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'blog':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export const ResourceCard = ({ resource, onOpenLink }: ResourceCardProps) => {
  const { type, title, link, score } = resource;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getResourceIcon(type)}</span>
            <Badge 
              variant="outline" 
              className={`${getResourceColor(type)} font-medium`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className={`text-sm font-medium ${getScoreColor(score)}`}>
              {(score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardTitle className="text-lg font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span className="truncate max-w-[200px]">
              {new URL(link).hostname}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenLink(link)}
            className="group/btn hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-1 group-hover/btn:scale-110 transition-transform" />
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
