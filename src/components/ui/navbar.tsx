
import { useState } from "react";
import { Button } from "./button";
import { Menu, X, LogIn, History, User, Home, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 font-bold text-xl">
            RideNav
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors flex items-center">
                  <Home className="h-4 w-4 mr-1" />
                  Início
                </Link>
                <Link to="/history" className="text-foreground/80 hover:text-foreground transition-colors flex items-center">
                  <History className="h-4 w-4 mr-1" />
                  Histórico
                </Link>
                <Link to="/notifications" className="text-foreground/80 hover:text-foreground transition-colors flex items-center">
                  <Bell className="h-4 w-4 mr-1" />
                  Notificações
                </Link>
                <Link to="/profile" className="text-foreground/80 hover:text-foreground transition-colors flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Perfil
                </Link>
              </>
            ) : (
              <>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
                  About
                </a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
                  Services
                </a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
                  Contact
                </a>
                <Link to="/auth" className="text-foreground/80 hover:text-foreground transition-colors flex items-center">
                  <LogIn className="h-4 w-4 mr-1" />
                  Login
                </Link>
                <Button variant="default" size="sm">
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden animate-fade-down">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <Link
                    to="/"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors flex items-center"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Início
                  </Link>
                  <Link
                    to="/history"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors flex items-center"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Histórico
                  </Link>
                  <Link
                    to="/notifications"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors flex items-center"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notificações
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors flex items-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Link>
                </>
              ) : (
                <>
                  <a
                    href="#"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors"
                  >
                    About
                  </a>
                  <a
                    href="#"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors"
                  >
                    Services
                  </a>
                  <a
                    href="#"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors"
                  >
                    Contact
                  </a>
                  <Link
                    to="/auth"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/10 transition-colors flex items-center"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                  <Button className="w-full mt-4">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
