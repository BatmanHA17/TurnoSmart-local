import React from "react";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TurnoSmartSocialProof = () => {
  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            +More than 10,000 companies use TurnoSmart every day
          </h2>
          <Button variant="link" className="text-blue-600 hover:text-blue-700 font-medium">
            Read reviews
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        {/* Rating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Capterra */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://cdn.prod.website-files.com/6422fb7d2bf3ee6a9ada64ef/65d5bff35e745cb3f107bcf5_Logo%20Capterra.svg"
                alt="Capterra"
                className="h-8"
              />
            </div>
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">4.7</p>
            <p className="text-sm text-gray-600 mb-4">on 5</p>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ease of use</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.7</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer support</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.7</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Features</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.5</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Value for money</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.5</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Google */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://cdn.prod.website-files.com/6422fb7d2bf3ee6a9ada64ef/65d5bff35e745cb3f107bcf6_Logo%20Google.svg"
                alt="Google"
                className="h-8"
              />
            </div>
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">4.8</p>
            <p className="text-sm text-gray-600">on 5</p>
          </div>
          
          {/* GetApp */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://cdn.prod.website-files.com/6422fb7d2bf3ee6a9ada64ef/65d5bff35e745cb3f107bcf7_Getapp.svg"
                alt="GetApp"
                className="h-8"
              />
            </div>
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">4.7</p>
            <p className="text-sm text-gray-600">on 5</p>
          </div>
        </div>
        
        {/* Company Logos */}
        <div className="mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {/* Company logos would go here - using placeholder for now */}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">Logo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};