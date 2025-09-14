import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, Clock, AlertCircle, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function IssueTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  // Fetch issues for tracking
  const { data: issues } = useQuery({
    queryKey: ["/api/issues", { limit: 20 }],
    queryFn: async () => {
      const response = await fetch("/api/issues?limit=20");
      return response.json();
    },
  });

  // Fetch specific issue details and history
  const { data: issueDetails } = useQuery({
    queryKey: ["/api/issues", selectedIssue],
    queryFn: async () => {
      if (!selectedIssue) return null;
      const response = await fetch(`/api/issues/${selectedIssue}`);
      return response.json();
    },
    enabled: !!selectedIssue,
  });

  const { data: issueHistory } = useQuery({
    queryKey: ["/api/issues", selectedIssue, "history"],
    queryFn: async () => {
      if (!selectedIssue) return [];
      const response = await fetch(`/api/issues/${selectedIssue}/history`);
      return response.json();
    },
    enabled: !!selectedIssue,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved": return <CheckCircle className="h-4 w-4 text-secondary" />;
      case "in_progress": return <Clock className="h-4 w-4 text-primary" />;
      default: return <AlertCircle className="h-4 w-4 text-accent" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "default";
      case "in_progress": return "secondary";
      case "acknowledged": return "outline";
      default: return "destructive";
    }
  };

  const filteredIssues = issues?.filter((issue: any) => 
    issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Track Your Issues</h2>
            <div className="flex space-x-2">
              <Input
                placeholder="Search by report ID, title, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="search-input"
              />
              <Button data-testid="search-button">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue: any) => (
                <Card 
                  key={issue.id} 
                  className={`cursor-pointer border transition-colors hover:bg-muted/50 ${
                    selectedIssue === issue.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedIssue(issue.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">{issue.title}</h4>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {issue.location}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(issue.status)} data-testid={`issue-status-${issue.id}`}>
                        {getStatusIcon(issue.status)}
                        <span className="ml-1">{issue.status.replace("_", " ")}</span>
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Report #{issue.id.slice(0, 8)}</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "No issues found matching your search" : "No issues found"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Issue View */}
      {selectedIssue && issueDetails && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{issueDetails.title}</h3>
                <p className="text-muted-foreground">Report ID: {issueDetails.id}</p>
                <p className="text-sm text-muted-foreground">
                  Submitted on {new Date(issueDetails.createdAt).toLocaleDateString()} at{" "}
                  {new Date(issueDetails.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <Badge variant={getStatusColor(issueDetails.status)} data-testid="selected-issue-status">
                {issueDetails.status.replace("_", " ")}
              </Badge>
            </div>

            {/* Progress Timeline */}
            <div className="mb-6">
              <h4 className="font-medium text-foreground mb-4">Progress Timeline</h4>
              <div className="relative">
                <div className="absolute left-4 top-0 h-full w-0.5 bg-border"></div>
                
                {issueHistory && issueHistory.length > 0 ? (
                  issueHistory.map((entry: any, index: number) => (
                    <div key={entry.id} className="relative flex items-center mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.status === "resolved" ? "bg-secondary" :
                        entry.status === "in_progress" ? "bg-primary" : "bg-accent"
                      }`}>
                        {getStatusIcon(entry.status)}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-foreground">
                          {entry.status.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()} at{" "}
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative flex items-center mb-4">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-foreground">Report Submitted</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(issueDetails.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Issue Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Issue Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Type:</span> {issueDetails.issueType}</p>
                  <p><span className="font-medium">Priority:</span> {issueDetails.priority}</p>
                  <p><span className="font-medium">Description:</span> {issueDetails.description}</p>
                  {issueDetails.aiConfidence && (
                    <p>
                      <span className="font-medium">AI Confidence:</span>{" "}
                      {Math.round(issueDetails.aiConfidence * 100)}%
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Location & Assignment</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Location:</span> {issueDetails.location}</p>
                  {issueDetails.address && (
                    <p><span className="font-medium">Address:</span> {issueDetails.address}</p>
                  )}
                  {issueDetails.ward && (
                    <p><span className="font-medium">Ward:</span> {issueDetails.ward}</p>
                  )}
                  {issueDetails.assignedDepartment && (
                    <p><span className="font-medium">Department:</span> {issueDetails.assignedDepartment}</p>
                  )}
                  {issueDetails.assignedTo && (
                    <p><span className="font-medium">Assigned To:</span> {issueDetails.assignedTo}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
