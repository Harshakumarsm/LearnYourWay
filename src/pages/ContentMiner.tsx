import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceCard } from "@/components/ContentMiner/ResourceCard";
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  BookOpen, 
  Video, 
  FileText, 
  Code, 
  PenTool,
  TrendingUp,
  Filter
} from "lucide-react";
import { apiService, ScrapeRequest, Resource } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

const levelOptions = [
  { value: "beginner", label: "Beginner", description: "Just getting started" },
  { value: "intermediate", label: "Intermediate", description: "Some experience" },
  { value: "advanced", label: "Advanced", description: "Expert level" },
];

const resourceTypeIcons = {
  article: FileText,
  docs: BookOpen,
  tutorial: Code,
  video: Video,
  blog: PenTool,
};

const ContentMiner = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const { toast } = useToast();
  const { isSignedIn } = useAuth();

  const {
    data: scrapeData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["scrape-resources", searchQuery, selectedLevel],
    queryFn: () => {
      if (!searchQuery.trim()) {
        throw new Error("Please enter a search topic");
      }
      return apiService.scrapeResources({
        topic: searchQuery.trim(),
        level: selectedLevel,
      });
    },
    enabled: searchTriggered && searchQuery.trim().length > 0 && isSignedIn,
    retry: 1,
  });

  const handleSearch = () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to search for resources.",
        variant: "destructive",
      });
      return;
    }
    
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a topic to search for resources.",
        variant: "destructive",
      });
      return;
    }
    setSearchTriggered(true);
    refetch();
  };

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const groupResourcesByType = (resources: Resource[]) => {
    return resources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource);
      return acc;
    }, {} as Record<string, Resource[]>);
  };

  const getResourceTypeStats = (resources: Resource[]) => {
    const grouped = groupResourcesByType(resources);
    return Object.entries(grouped).map(([type, items]) => ({
      type: type as keyof typeof resourceTypeIcons,
      count: items.length,
      avgScore: (items.reduce((sum, item) => sum + item.score, 0) / items.length).toFixed(1),
      Icon: resourceTypeIcons[type as keyof typeof resourceTypeIcons],
    }));
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">ContentMiner</h1>
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-8">
            {/* Search Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Discover Learning Resources
                </CardTitle>
                <p className="text-muted-foreground">
                  Enter a topic and select your skill level to find curated learning resources
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g., Machine Learning, Python Programming, Web Development..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="text-base"
                    />
                  </div>
                  <Select value={selectedLevel} onValueChange={(value: any) => setSelectedLevel(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="px-8"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {searchTriggered && (
              <>
                {isLoading && (
                  <Card className="mb-6">
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Mining resources for you...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          This may take a few moments as we search multiple sources
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Card className="mb-6 border-destructive">
                    <CardContent className="flex items-center gap-3 py-6">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <div>
                        <p className="font-medium text-destructive">Search Failed</p>
                        <p className="text-sm text-muted-foreground">
                          {error instanceof Error ? error.message : "An unexpected error occurred"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {scrapeData && !isLoading && (
                  <>
                    {/* Summary Stats */}
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Search Results
                        </CardTitle>
                        <p className="text-muted-foreground">
                          {scrapeData.content}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {getResourceTypeStats(scrapeData.resources).map((stat) => {
                            const Icon = stat.Icon;
                            return (
                              <div key={stat.type} className="text-center p-3 bg-muted/50 rounded-lg">
                                <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                <div className="font-semibold">{stat.count}</div>
                                <div className="text-xs text-muted-foreground capitalize">{stat.type}s</div>
                                <div className="text-xs text-muted-foreground">Avg: {stat.avgScore}</div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Resources by Type */}
                    <Tabs defaultValue="all" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="all">All ({scrapeData.resources.length})</TabsTrigger>
                        {getResourceTypeStats(scrapeData.resources).map((stat) => (
                          <TabsTrigger key={stat.type} value={stat.type}>
                            {stat.type}s ({stat.count})
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent value="all" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {scrapeData.resources.map((resource, index) => (
                            <ResourceCard
                              key={`${resource.link}-${index}`}
                              resource={resource}
                              onOpenLink={handleOpenLink}
                            />
                          ))}
                        </div>
                      </TabsContent>

                      {getResourceTypeStats(scrapeData.resources).map((stat) => {
                        const resources = groupResourcesByType(scrapeData.resources)[stat.type] || [];
                        return (
                          <TabsContent key={stat.type} value={stat.type} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {resources.map((resource, index) => (
                                <ResourceCard
                                  key={`${resource.link}-${index}`}
                                  resource={resource}
                                  onOpenLink={handleOpenLink}
                                />
                              ))}
                            </div>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </>
                )}
              </>
            )}

            {/* Empty State */}
            {!searchTriggered && (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Discover Resources?</h3>
                  <p className="text-muted-foreground mb-6">
                    {isSignedIn 
                      ? "Enter a topic above to start mining curated learning resources"
                      : "Please sign in to search for curated learning resources"
                    }
                  </p>
                  {isSignedIn && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {["Machine Learning", "Python", "React", "Data Science", "Web Development"].map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => setSearchQuery(topic)}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ContentMiner;
