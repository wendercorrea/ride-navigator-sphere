
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const LoadingState = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Histórico de Corridas</CardTitle>
          <CardDescription>Seus deslocamentos recentes</CardDescription>
        </CardHeader>
      </Card>
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
};
