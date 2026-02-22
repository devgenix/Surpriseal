"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  onSelect: () => void;
  loading?: boolean;
  highlighted?: boolean;
}

export function PricingCard({
  title,
  description,
  price,
  features,
  buttonText,
  onSelect,
  loading,
  highlighted,
}: PricingCardProps) {
  return (
    <Card className={cn("flex flex-col h-full transition-all duration-300 hover:shadow-xl", highlighted && "border-primary ring-1 ring-primary")}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-4xl font-extrabold">{price}</span>
        </div>
        <ul className="space-y-3 text-sm">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          size="lg" 
          onClick={onSelect} 
          disabled={loading}
          variant={highlighted ? "default" : "outline"}
        >
          {loading ? "Creating..." : buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
