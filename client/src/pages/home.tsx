import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, MapPin } from "lucide-react";
import ReportForm from "@/components/report-form";
import IssueTracker from "@/components/issue-tracker";
import IssueMap from "@/components/issue-map";
import AdminPanel from "@/components/admin-panel";

type TabType = "report" | "track" | "map" | "admin";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("report");
  const [language, setLanguage] = useState("en");

  const tabs = [
    { id: "report", label: "Report Issue", icon: "fas fa-plus-circle" },
    { id: "track", label: "Track Issues", icon: "fas fa-search" },
    { id: "map", label: "Issue Map", icon: "fas fa-map" },
    { id: "admin", label: "Admin Panel", icon: "fas fa-cog" },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin className="text-primary text-2xl" />
                <span className="text-xl font-bold text-foreground">CivicReport</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <select 
                className="bg-input border border-border rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-ring"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                data-testid="language-selector"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
              </select>
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" data-testid="notifications-button">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" data-testid="profile-button">
                  <User className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  data-testid={`tab-${tab.id}`}
                >
                  <i className={`${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "report" && <ReportForm language={language} />}
          {activeTab === "track" && <IssueTracker />}
          {activeTab === "map" && <IssueMap />}
          {activeTab === "admin" && <AdminPanel />}
        </div>
      </div>
    </div>
  );
}
