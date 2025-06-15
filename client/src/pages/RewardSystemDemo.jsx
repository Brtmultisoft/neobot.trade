import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  User, 
  Trophy, 
  BarChart3,
  MapPin,
  Plane,
  Users,
  DollarSign
} from 'lucide-react';

// Import components
import RewardDashboard from '../components/admin/RewardDashboard';
import UserProgressTracker from '../components/admin/UserProgressTracker';
import RewardProgress from '../components/user/RewardProgress';
import RewardLeaderboard from '../components/user/RewardLeaderboard';

const RewardSystemDemo = () => {
  const [activeView, setActiveView] = useState('admin-dashboard');
  const [selectedUserId, setSelectedUserId] = useState('user123');

  const ViewSelector = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span>Reward System Demo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant={activeView === 'admin-dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('admin-dashboard')}
            className="flex items-center space-x-2"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Dashboard</span>
          </Button>
          
          <Button
            variant={activeView === 'admin-tracker' ? 'default' : 'outline'}
            onClick={() => setActiveView('admin-tracker')}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Progress Tracker</span>
          </Button>
          
          <Button
            variant={activeView === 'user-progress' ? 'default' : 'outline'}
            onClick={() => setActiveView('user-progress')}
            className="flex items-center space-x-2"
          >
            <User className="h-4 w-4" />
            <span>User Progress</span>
          </Button>
          
          <Button
            variant={activeView === 'leaderboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('leaderboard')}
            className="flex items-center space-x-2"
          >
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Reward System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              <span><strong>Goa Tour:</strong> $1,000 self + $1,500 direct business</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4 text-blue-500" />
              <span><strong>Bangkok Tour:</strong> $5,000 self + $10,000 direct business</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FeatureHighlights = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-4 text-center">
          <MapPin className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <div className="font-semibold text-orange-800">Goa Tour Tracking</div>
          <div className="text-sm text-orange-600">$1,000 + $1,500 targets</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4 text-center">
          <Plane className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="font-semibold text-blue-800">Bangkok Tour Tracking</div>
          <div className="text-sm text-blue-600">$5,000 + $10,000 targets</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 text-center">
          <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="font-semibold text-green-800">Progress Tracking</div>
          <div className="text-sm text-green-600">Real-time updates</div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4 text-center">
          <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="font-semibold text-purple-800">Leaderboard</div>
          <div className="text-sm text-purple-600">Top achievers</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'admin-dashboard':
        return (
          <div>
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">🛡️ Admin Dashboard Features:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• View all eligible users for rewards</li>
                <li>• Approve and process reward qualifications</li>
                <li>• Monitor reward statistics and trends</li>
                <li>• Manage reward workflow and status</li>
              </ul>
            </div>
            <RewardDashboard />
          </div>
        );
        
      case 'admin-tracker':
        return (
          <div>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Progress Tracker Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Track all users' progress towards rewards</li>
                <li>• Filter and search users by criteria</li>
                <li>• Export progress data to CSV</li>
                <li>• View detailed investment and referral data</li>
              </ul>
            </div>
            <UserProgressTracker />
          </div>
        );
        
      case 'user-progress':
        return (
          <div>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">👤 User Progress Features:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Personal reward progress tracking</li>
                <li>• Shows exactly how much more is needed</li>
                <li>• Direct referrals overview</li>
                <li>• Reward history and status</li>
              </ul>
            </div>
            <RewardProgress userId={selectedUserId} />
          </div>
        );
        
      case 'leaderboard':
        return (
          <div>
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">🏆 Leaderboard Features:</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Showcase top reward achievers</li>
                <li>• Separate rankings for each reward type</li>
                <li>• Motivational display for all users</li>
                <li>• Achievement dates and amounts</li>
              </ul>
            </div>
            <RewardLeaderboard />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 Neobot Reward System
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Complete Implementation Demo - Admin & User Interfaces
          </p>
          <div className="flex justify-center space-x-4">
            <Badge className="bg-green-500 text-white">✅ Fully Implemented</Badge>
            <Badge className="bg-blue-500 text-white">🚀 Production Ready</Badge>
            <Badge className="bg-purple-500 text-white">🧪 Thoroughly Tested</Badge>
          </div>
        </div>

        {/* View Selector */}
        <ViewSelector />

        {/* Feature Highlights */}
        <FeatureHighlights />

        {/* Active View */}
        <div className="bg-white rounded-lg shadow-sm border">
          {renderActiveView()}
        </div>

        {/* Implementation Summary */}
        <Card className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center">🎉 Implementation Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">✅ Admin Side Features:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Eligible users dashboard with approval workflow</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span>Comprehensive progress tracking for all users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>Real-time statistics and analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span>Export functionality for data analysis</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">✅ User Side Features:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span>Personal progress dashboard with exact requirements</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-blue-500" />
                    <span>Motivational leaderboard showcasing achievers</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>Clear visualization of how much more is needed</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Plane className="h-4 w-4 text-blue-500" />
                    <span>Direct referrals tracking and history</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-center">
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Reward Targets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-center space-x-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Goa Tour: $1,000 self + $1,500 direct business</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Plane className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Bangkok Tour: $5,000 self + $10,000 direct business</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RewardSystemDemo;
