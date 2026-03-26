import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";

export const TurnoSmartHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <TurnoSmartLogo size="md" />
            <span className="text-xl font-bold text-gray-900">TurnoSmart</span>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-gray-700 hover:text-gray-900 font-medium rounded-full"
              onClick={() => navigate("/auth")}
            >
              Sign in
            </Button>
            
            <Button 
              variant="outline" 
              className="text-gray-700 border-gray-300 hover:bg-gray-50 font-medium rounded-full"
            >
              Get a demo
            </Button>
            
            <Button 
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 rounded-full"
              onClick={() => {
                navigate('/register');
              }}
            >
              Start your Free Trial
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};