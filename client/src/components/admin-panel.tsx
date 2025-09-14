import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Download, Bell, Eye, Edit, MapPin, Clock, User, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminPanel() {
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [updateData, setUpdateData] = useState({
    status: "",
    notes: "",
    assignedDepartment: "",
    assignedTo: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin statistics
  const { data: adminStats } = useQuery({
    queryKey: ["/api/stats", "admin"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      return response.json();
    },
  });

  // Fetch all issues for admin
  const { data: adminIssues } = useQuery({
    queryKey: ["/api/issues", "admin", departmentFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentFilter !== "all") params.append("department", departmentFilter);
      params.append("limit", "50");
      
      const response = await fetch(`/api/issues?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const response = await fetch("/api/departments");
      return response.json();
    },
  });

  // Update issue status mutation
  const updateIssueMutation = useMutation({
    mutationFn: async ({ issueId, updateData }: { issueId: string; updateData: any }) => {
      return apiRequest("PATCH", `/api/issues/${issueId}/status`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Issue Updated",
        description: "Issue status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedIssue(null);
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the issue. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateIssue = () => {
    if (selectedIssue && updateData.status) {
      updateIssueMutation.mutate({
        issueId: selectedIssue.id,
        updateData: {
          ...updateData,
          updatedBy: "admin", // In a real app, this would be the current admin user ID
        },
      });
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Dashboard Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-foreground">Admin Dashboard</h2>
            <div className="flex space-x-2">
              <Button data-testid="export-data-button">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="secondary" data-testid="send-alerts-button">
                <Bell className="mr-2 h-4 w-4" />
                Send Alerts
              </Button>
            </div>
          </div>

          {/* Admin Stats */}
          <div className="grid md:grid-cols-5 gap-4">
            <Card className="bg-muted">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="admin-total-issues">
                  {adminStats?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Issues</div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent" data-testid="admin-pending-review">
                  {adminStats?.pending || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary" data-testid="admin-in-progress">
                  {adminStats?.inProgress || 0}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary" data-testid="admin-resolved">
                  {adminStats?.resolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="admin-avg-resolution">
                  {adminStats?.avgResolutionDays || 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg Days to Resolve</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Issue Management Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Issue Management</h3>
            <div className="flex space-x-2">
              <Select 
                value={departmentFilter} 
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-48" data-testid="department-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={priorityFilter} 
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger className="w-32" data-testid="priority-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">Issue ID</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Assigned To</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminIssues && adminIssues.length > 0 ? (
                  adminIssues.map((issue: any) => (
                    <tr key={issue.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-foreground" data-testid={`issue-id-${issue.id}`}>
                        {issue.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        <div className="flex items-center space-x-2">
                          {issue.issueType === "pothole" && <MapPin className="h-4 w-4 text-muted-foreground" />}
                          {issue.issueType === "streetlight" && <Bell className="h-4 w-4 text-muted-foreground" />}
                          {issue.issueType === "garbage" && <Clock className="h-4 w-4 text-muted-foreground" />}
                          <span>{issue.issueType}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{issue.location}</td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant={getPriorityColor(issue.priority)}>
                          {issue.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant={getStatusColor(issue.status)} data-testid={`admin-issue-status-${issue.id}`}>
                          {issue.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {issue.assignedDepartment || "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" data-testid={`view-issue-${issue.id}`}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setUpdateData({
                                    status: issue.status,
                                    notes: "",
                                    assignedDepartment: issue.assignedDepartment || "",
                                    assignedTo: issue.assignedTo || "",
                                  });
                                }}
                                data-testid={`update-issue-${issue.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Issue</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="status">Status</Label>
                                  <Select 
                                    value={updateData.status} 
                                    onValueChange={(value) => setUpdateData(prev => ({...prev, status: value}))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="submitted">Submitted</SelectItem>
                                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="department">Assigned Department</Label>
                                  <Select 
                                    value={updateData.assignedDepartment} 
                                    onValueChange={(value) => setUpdateData(prev => ({...prev, assignedDepartment: value}))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {departments?.map((dept: any) => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                          {dept.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="assignedTo">Assigned To</Label>
                                  <Input
                                    value={updateData.assignedTo}
                                    onChange={(e) => setUpdateData(prev => ({...prev, assignedTo: e.target.value}))}
                                    placeholder="Enter staff member name"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="notes">Update Notes</Label>
                                  <Textarea
                                    value={updateData.notes}
                                    onChange={(e) => setUpdateData(prev => ({...prev, notes: e.target.value}))}
                                    placeholder="Add any notes about this update..."
                                  />
                                </div>
                                
                                <Button 
                                  onClick={handleUpdateIssue}
                                  disabled={updateIssueMutation.isPending}
                                  className="w-full"
                                  data-testid="submit-update-button"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {updateIssueMutation.isPending ? "Updating..." : "Update Issue"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No issues found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Department Performance</h3>
            <div className="space-y-4">
              {departments?.slice(0, 4).map((dept: any, index: number) => {
                const performance = [85, 92, 78, 88][index] || 75;
                return (
                  <div key={dept.id} className="flex justify-between items-center">
                    <span className="text-foreground">{dept.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full" 
                          style={{ width: `${performance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">{performance}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">SLA Compliance</h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2" data-testid="sla-compliance">
                  87%
                </div>
                <p className="text-sm text-muted-foreground">Overall SLA Compliance</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-foreground" data-testid="on-time-count">
                    {adminStats?.resolved || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">On Time</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-accent" data-testid="delayed-count">
                    {adminStats?.pending || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Delayed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
