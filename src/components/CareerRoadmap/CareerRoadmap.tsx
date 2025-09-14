import React, { useState } from 'react';
import { Search, MapPin, Loader2, Star, TrendingUp, BookOpen, Wrench, Target, DollarSign, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RoadmapData {
  overview?: string;
  key_skills?: string[];
  tools_tech?: string[];
  learning_path?: string[];
  milestones?: string[];
  salary_range?: string;
  job_market?: string;
  error?: string;
  raw_response?: string;
}

interface CareerSuggestion {
  query: string;
  results: string[];
  total: number;
}

const CareerRoadmap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingCareers, setSearchingCareers] = useState(false);
  const [currentCareer, setCurrentCareer] = useState('');

  const API_BASE_URL = 'http://localhost:8001';

  const searchCareerSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setSearchingCareers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
      const data: CareerSuggestion = await response.json();
      setSuggestions(data.results || []);
    } catch (error) {
      console.error('Error searching careers:', error);
      setSuggestions([]);
    } finally {
      setSearchingCareers(false);
    }
  };

  const generateRoadmap = async (career: string) => {
    if (!career.trim()) return;

    setLoading(true);
    setCurrentCareer(career);
    setRoadmapData(null);
    setSuggestions([]);

    try {
      const response = await fetch(`${API_BASE_URL}/roadmap?career=${encodeURIComponent(career)}`);
      const data = await response.json();
      setRoadmapData(data.roadmap || data);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      setRoadmapData({
        error: 'Failed to generate roadmap. Please check if the backend service is running.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    generateRoadmap(searchQuery);
  };

  const handleSuggestionClick = (career: string) => {
    setSearchQuery(career);
    generateRoadmap(career);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchCareerSuggestions(value);
  };

  const renderOverviewSection = (overview: string) => (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-primary">
          <Star className="w-6 h-6" />
          Career Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base leading-relaxed text-foreground font-medium">
          {overview}
        </p>
      </CardContent>
    </Card>
  );

  const renderSkillsSection = (skills: string[]) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          Essential Skills
        </CardTitle>
        <CardDescription>Core competencies you'll need to develop</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {skills.map((skill, index) => {
            const [skillName, description] = skill.split(': ');
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900">{skillName}</h4>
                  {description && <p className="text-sm text-blue-700 mt-1">{description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderToolsSection = (tools: string[]) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Wrench className="w-6 h-6 text-orange-600" />
          Tools & Technologies
        </CardTitle>
        <CardDescription>Essential tools and technologies to master</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {tools.map((tool, index) => {
            const [toolName, usage] = tool.split(': ');
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <Wrench className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-orange-900">{toolName}</h4>
                  {usage && <p className="text-sm text-orange-700 mt-1">{usage}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderLearningPathSection = (learningPath: string[]) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-green-600" />
          Learning Path
        </CardTitle>
        <CardDescription>Step-by-step progression to build your expertise</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {learningPath.map((step, index) => {
            const [stepTitle, description] = step.split(': ');
            const progress = ((index + 1) / learningPath.length) * 100;
            return (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="font-semibold text-green-900 mb-1">{stepTitle}</h4>
                    {description && <p className="text-sm text-green-700">{description}</p>}
                    <Progress value={progress} className="mt-2 h-2" />
                  </div>
                </div>
                {index < learningPath.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-6 bg-green-200"></div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderMilestonesSection = (milestones: string[]) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="w-6 h-6 text-purple-600" />
          Career Milestones
        </CardTitle>
        <CardDescription>Timeline of key achievements and goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const [timeframe, goal] = milestone.split(': ');
            return (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-purple-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">{timeframe}</h4>
                  {goal && <p className="text-sm text-purple-700 mt-1">{goal}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderMarketInfoSection = (salaryRange: string, jobMarket: string) => (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
            <DollarSign className="w-5 h-5" />
            Salary Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-emerald-700 font-medium">{salaryRange}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-indigo-800">
            <BarChart3 className="w-5 h-5" />
            Job Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-indigo-700 font-medium">{jobMarket}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <MapPin className="w-8 h-8 text-primary" />
          Career Roadmap Generator
        </h1>
        <p className="text-muted-foreground">
          Get AI-powered career guidance and step-by-step roadmaps for your dream career
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Search for a Career</CardTitle>
          <CardDescription>
            Enter a career title to get a personalized roadmap with skills, tools, and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g., Data Scientist, Software Developer, UX Designer..."
                value={searchQuery}
                onChange={handleInputChange}
                className="pr-12"
                disabled={loading}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            
            {/* Career Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((career, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleSuggestionClick(career)}
                    >
                      {career}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Generate Career Roadmap
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Generating your career roadmap...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roadmap Results */}
      {roadmapData && !loading && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Career Roadmap: {currentCareer}
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>

          {roadmapData.error ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p className="font-medium">Error generating roadmap</p>
                  <p className="text-sm mt-1">{roadmapData.error}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {roadmapData.overview && renderOverviewSection(roadmapData.overview)}
              
              {roadmapData.salary_range && roadmapData.job_market && 
                renderMarketInfoSection(roadmapData.salary_range, roadmapData.job_market)
              }
              
              {roadmapData.key_skills && roadmapData.key_skills.length > 0 && 
                renderSkillsSection(roadmapData.key_skills)
              }
              
              {roadmapData.tools_tech && roadmapData.tools_tech.length > 0 && 
                renderToolsSection(roadmapData.tools_tech)
              }
              
              {roadmapData.learning_path && roadmapData.learning_path.length > 0 && 
                renderLearningPathSection(roadmapData.learning_path)
              }
              
              {roadmapData.milestones && roadmapData.milestones.length > 0 && 
                renderMilestonesSection(roadmapData.milestones)
              }
              
              {roadmapData.raw_response && (
                <Card className="border-muted bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {roadmapData.raw_response}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>💡 Tip: Try searching for specific roles like "Machine Learning Engineer" or "Product Manager" for more detailed roadmaps</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CareerRoadmap;
