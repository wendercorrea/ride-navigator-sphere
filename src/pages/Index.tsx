
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";

const Index = () => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-secondary to-background">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none" />

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-down">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Safe and Reliable Rides
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Your Journey, Our Priority
          </h1>
          <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
            Experience seamless transportation with our premium ride-hailing service.
            Book your ride in seconds.
          </p>
        </div>

        {/* Ride Booking Card */}
        <Card className="w-full max-w-md p-6 animate-fade-up glass-effect">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Pickup location"
                  className="pl-10"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Where to?"
                  className="pl-10"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" size="lg">
              <Search className="mr-2 h-4 w-4" />
              Find a Ride
            </Button>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12 animate-slide-up-fade">
          {[
            {
              title: "Real-time Tracking",
              description: "Track your ride in real-time with live GPS updates",
            },
            {
              title: "Safe Rides",
              description: "Verified drivers and safety features for peace of mind",
            },
            {
              title: "24/7 Support",
              description: "Round-the-clock customer support for assistance",
            },
          ].map((feature, index) => (
            <Card key={index} className="p-6 text-center glass-effect">
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
