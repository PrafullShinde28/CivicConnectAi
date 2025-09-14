import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, MessageSquare, Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "./photo-upload";
import VoiceRecorder from "./voice-recorder";
import type { IssueDetectionResult, TranscriptionResult, IssueFormData } from "@/lib/types";

interface ReportFormProps {
  language: string;
}

export default function ReportForm({ language }: ReportFormProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    title: "",
    description: "",
    issueType: "",
    priority: "medium",
    location: "",
    address: "",
    ward: "",
    language: language,
  });
  
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [aiDetection, setAiDetection] = useState<IssueDetectionResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent reports
  const { data: recentReports } = useQuery({
    queryKey: ["/api/issues"],
    queryFn: async () => {
      const response = await fetch("/api/issues?limit=5");
      return response.json();
    },
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      return response.json();
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/issues", data);
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your issue has been reported successfully.",
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        issueType: "",
        priority: "medium",
        location: "",
        address: "",
        ward: "",
        language: language,
      });
      setSelectedPhoto(null);
      setAiDetection(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      console.error("Submit failed:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDetectionResult = (result: IssueDetectionResult) => {
    setAiDetection(result);
    setFormData(prev => ({
      ...prev,
      title: result.description,
      description: result.description,
      issueType: result.issueType,
      priority: result.severity,
    }));
  };

  const handleTranscriptionResult = (result: TranscriptionResult) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description + "\n" + result.transcription,
      issueType: result.extractedInfo.issueType || prev.issueType,
      location: result.extractedInfo.location || prev.location,
      priority: result.extractedInfo.priority || prev.priority,
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setFormData(prev => ({
            ...prev,
            latitude: latitude,
            longitude: longitude,
          }));
          toast({
            title: "Location Captured",
            description: "GPS coordinates added to your report.",
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Location Error",
            description: "Could not get your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        submitData.append(key, value.toString());
      }
    });
    
    // Add photo if selected
    if (selectedPhoto) {
      submitData.append("photo", selectedPhoto);
    }
    
    // Add location if available
    if (currentLocation) {
      submitData.append("latitude", currentLocation.lat.toString());
      submitData.append("longitude", currentLocation.lng.toString());
    }
    
    submitReportMutation.mutate(submitData);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left Column - Report Form */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Report a Civic Issue</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload Section */}
              <PhotoUpload 
                onDetectionResult={handleDetectionResult}
                onImageSelected={setSelectedPhoto}
              />
              
              {/* AI Detection Result */}
              {aiDetection && (
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium text-foreground">AI Detection Result:</p>
                        <p className="text-sm text-muted-foreground">
                          {aiDetection.issueType} detected with {Math.round(aiDetection.confidence * 100)}% confidence
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Voice Recording Section */}
              <VoiceRecorder 
                onTranscriptionResult={handleTranscriptionResult}
                language={language}
              />

              {/* Location & Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Location & Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issueType">Issue Type</Label>
                    <Select 
                      value={formData.issueType} 
                      onValueChange={(value) => setFormData(prev => ({...prev, issueType: value}))}
                    >
                      <SelectTrigger data-testid="issue-type-select">
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pothole">Pothole</SelectItem>
                        <SelectItem value="garbage">Garbage Overflow</SelectItem>
                        <SelectItem value="streetlight">Broken Streetlight</SelectItem>
                        <SelectItem value="water_leakage">Water Leakage</SelectItem>
                        <SelectItem value="road_damage">Road Damage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData(prev => ({...prev, priority: value}))}
                    >
                      <SelectTrigger data-testid="priority-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="location"
                      placeholder="Address or landmark"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                      data-testid="location-input"
                    />
                    <Button type="button" onClick={getCurrentLocation} data-testid="gps-button">
                      <MapPin className="mr-2 h-4 w-4" />
                      Use GPS
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide any additional information..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    className="h-24"
                    data-testid="description-textarea"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitReportMutation.isPending}
                data-testid="submit-report-button"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitReportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Alternative Reporting Methods */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Alternative Reporting Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Toll-Free Number</p>
                    <p className="text-sm text-muted-foreground">Call 1800-CIVIC-HELP</p>
                  </div>
                </div>
                <Button data-testid="call-button">Call Now</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="text-secondary" />
                  <div>
                    <p className="font-medium text-foreground">WhatsApp Bot</p>
                    <p className="text-sm text-muted-foreground">Send issues via WhatsApp</p>
                  </div>
                </div>
                <Button variant="secondary" data-testid="whatsapp-button">Open Chat</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Recent Submissions */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Your Recent Reports</h3>
            
            <div className="space-y-4">
              {recentReports && recentReports.length > 0 ? (
                recentReports.map((report: any) => (
                  <Card key={report.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">{report.location}</p>
                        </div>
                        <Badge 
                          variant={
                            report.status === "resolved" ? "default" :
                            report.status === "in_progress" ? "secondary" : "outline"
                          }
                          data-testid={`status-${report.id}`}
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Reported {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-foreground">Report #{report.id.slice(0, 8)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reports yet</p>
                  <p className="text-sm text-muted-foreground">Your submitted reports will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary" data-testid="total-reports-stat">
                  {userStats?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Reports</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-secondary" data-testid="resolved-reports-stat">
                  {userStats?.resolved || 0}
                </div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
