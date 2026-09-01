
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Wrench } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  features?: string[];
}

export default function ComingSoon({ title, description, icon, features }: ComingSoonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-6">
              <Wrench className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              SOON
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon</h3>
          <p className="text-gray-500 max-w-md mb-6">
            Fitur ini sedang dalam pengembangan dan akan segera tersedia.
          </p>

          {features && features.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 w-full max-w-md">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fitur yang akan datang:
              </h4>
              <ul className="text-left text-sm text-gray-600 space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
