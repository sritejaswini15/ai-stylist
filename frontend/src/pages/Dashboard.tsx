import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Plus, 
  Sparkles, 
  Zap, 
  LogOut, 
  Shirt,
  Heart,
  LayoutGrid,
  User,
  Wand2,
  Search,
  Maximize2,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getMe } from "@/services/user";

interface UserData {
  username: string;
  email: string;
  name?: string;
  profilePicture?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchUserData = async () => {
      try {
        const data = await getMe(token);
        if (data.status === "success") {
          setUserData(data.data.user);
        } else {
          toast.error("Failed to fetch user data");
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Failed to fetch user profile") {
           localStorage.removeItem("token");
           navigate("/signin");
           return;
        }
        toast.error("An error occurred while fetching user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  const displayName = userData?.name || userData?.username || "Style Enthusiast";
  const userInitial = displayName.charAt(0).toUpperCase();

  const featureCards = [
    {
      icon: Plus,
      title: "Add Clothes",
      description: "Upload new items to your wardrobe",
      color: "text-blue-500",
      link: "/add-clothes"
    },
    {
      icon: Maximize2,
      title: "Studio",
      description: "Mix and match looks in the interactive room",
      color: "text-purple-500",
      link: "/dressing-room",
    },
    {
      icon: Sparkles,
      title: "AI Try-On",
      description: "Virtual outfit simulation",
      color: "text-gold",
      link: "/ai-try-on"
    },
    {
      icon: Zap,
      title: "AI Stylist",
      description: "Get personalized suggestions",
      color: "text-orange-500",
      link: "/ai-stylist"
    },
    {
      icon: Wand2,
      title: "Generate Outfit",
      description: "AI curates a perfect look for you",
      color: "text-indigo-500",
      link: "/generate-outfit"
    },
    {
      icon: Search,
      title: "Find Outfits",
      description: "Discover new outfit ideas",
      color: "text-green-500",
      link: "/find-outfits"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="font-display text-2xl font-bold tracking-tight text-foreground shrink-0">
            clueless
          </Link>

          <div className="flex items-center gap-8 md:gap-12">
            <div className="hidden sm:flex items-center gap-10">
              <Link 
                to="/wardrobe" 
                className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5"
              >
                <Shirt className="w-4 h-4" />
                Wardrobe
              </Link>
              <Link 
                to="/wishlist" 
                className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5"
              >
                <Heart className="w-4 h-4" />
                Wishlist
              </Link>
              <Link 
                to="/moodboard" 
                className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5"
              >
                <LayoutGrid className="w-4 h-4" />
                Moodboard
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-secondary text-gold font-display">{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none font-display">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground font-body">{userData?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer font-body">
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive font-body">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto">
          <header className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Welcome back, <span className="italic text-gold">{userData?.name?.split(' ')[0] || userData?.username}</span>
            </h1>
            <p className="text-muted-foreground font-body text-lg">
              What are we wearing today?
            </p>
          </header>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {featureCards.map((card, index) => (
              <div 
                key={index}
                onClick={() => card.link && navigate(card.link)}
                className="group relative bg-card border border-border rounded-3xl p-10 transition-all duration-300 hover:shadow-2xl hover:shadow-gold/5 hover:-translate-y-2 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <card.icon className="w-32 h-32" />
                </div>
                
                <div className={`w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`w-7 h-7 ${card.color || 'text-gold'}`} />
                </div>
                
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                  {card.title}
                </h3>
                <p className="text-muted-foreground font-body text-base leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Quick Nav */}
      <div className="sm:hidden flex justify-around border-t border-border bg-background/80 backdrop-blur-md fixed bottom-0 w-full py-4 z-50">
        <Link to="/wardrobe" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-gold transition-colors">
          <Shirt className="w-5 h-5" />
          <span className="text-[10px] font-body uppercase tracking-widest">Wardrobe</span>
        </Link>
        <Link to="/wishlist" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-gold transition-colors">
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-body uppercase tracking-widest">Wishlist</span>
        </Link>
        <Link to="/moodboard" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-gold transition-colors">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-body uppercase tracking-widest">Moodboard</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

