import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Minus, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { MapFilters } from "@/lib/types";

export default function IssueMap() {
  const [filters, setFilters] = useState<MapFilters>({
    issueType: "all",
    status: "all",
    timePeriod: "7days",
  });

  // Fetch issues for map display
  const { data: issues } = useQuery({
    queryKey: ["/api/issues", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.issueType !== "all") params.append("issueType", filters.issueType);
      if (filters.status !== "all") params.append("status", filters.status);
      
      const response = await fetch(`/api/issues?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch map statistics
  const { data: mapStats } = useQuery({
    queryKey: ["/api/stats", "map"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      return response.json();
    },
  });

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-secondary";
      case "in_progress": return "bg-primary";
      case "acknowledged": return "bg-accent";
      default: return "bg-destructive";
    }
  };

  const getMarkerIcon = (issueType: string) => {
    switch (issueType) {
      case "pothole": return "!";
      case "streetlight": return "💡";
      case "garbage": return "🗑";
      case "water_leakage": return "💧";
      default: return "?";
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Filter by:</label>
              <Select 
                value={filters.issueType} 
                onValueChange={(value) => setFilters(prev => ({...prev, issueType: value}))}
              >
                <SelectTrigger className="w-32" data-testid="issue-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="pothole">Potholes</SelectItem>
                  <SelectItem value="garbage">Garbage</SelectItem>
                  <SelectItem value="streetlight">Streetlights</SelectItem>
                  <SelectItem value="water_leakage">Water Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Status:</label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}
              >
                <SelectTrigger className="w-32" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Time Period:</label>
              <Select 
                value={filters.timePeriod} 
                onValueChange={(value) => setFilters(prev => ({...prev, timePeriod: value}))}
              >
                <SelectTrigger className="w-32" data-testid="time-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="h-96 bg-muted relative overflow-hidden"
            style={{
              backgroundImage: "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
            }}
          >
            {/* Simulated city map background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
            
            {/* Map Markers */}
            {issues && issues.slice(0, 8).map((issue: any, index: number) => {
              const positions = [
                { top: "20%", left: "25%" },
                { top: "40%", left: "45%" },
                { top: "30%", right: "35%" },
                { top: "60%", left: "30%" },
                { top: "70%", right: "25%" },
                { top: "25%", right: "20%" },
                { top: "50%", left: "60%" },
                { top: "80%", left: "50%" },
              ];
              
              return (
                <div
                  key={issue.id}
                  className={`absolute cursor-pointer transform hover:scale-110 transition-transform ${positions[index]?.top ? `top-[${positions[index].top}]` : ""} ${positions[index]?.left ? `left-[${positions[index].left}]` : ""} ${positions[index]?.right ? `right-[${positions[index].right}]` : ""}`}
                  style={{
                    top: positions[index]?.top,
                    left: positions[index]?.left,
                    right: positions[index]?.right,
                  }}
                  title={`${issue.title} - ${issue.status}`}
                  data-testid={`map-marker-${issue.id}`}
                >
                  <div className={`w-6 h-6 ${getMarkerColor(issue.status)} rounded-full border-2 border-background shadow-lg flex items-center justify-center text-xs font-bold text-white`}>
                    {getMarkerIcon(issue.issueType)}
                  </div>
                </div>
              );
            })}
            
            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 border border-border">
              <h4 className="font-medium text-foreground mb-2 text-sm">Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="text-foreground">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-foreground">In Progress</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <span className="text-foreground">Resolved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-destructive rounded-full"></div>
                  <span className="text-foreground">Urgent</span>
                </div>
              </div>
            </div>
            
            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <Button size="icon" variant="outline" data-testid="zoom-in-button">
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" data-testid="zoom-out-button">
                <Minus className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" data-testid="home-button">
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent" data-testid="pending-count">
              {mapStats?.pending || 0}
            </div>
            <div className="text-sm text-muted-foreground">Pending Issues</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary" data-testid="in-progress-count">
              {mapStats?.inProgress || 0}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary" data-testid="resolved-count">
              {mapStats?.resolved || 0}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground" data-testid="avg-resolution-time">
              {mapStats?.avgResolutionDays || 0}
            </div>
            <div className="text-sm text-muted-foreground">Avg Days to Resolve</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
