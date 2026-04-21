import { useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  Shirt,
  Heart,
  LayoutGrid,
  MessageSquare,
  User,
  LogOut
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
import { useEffect, useState } from "react";
import { getMe } from "@/services/user";

interface UserData {
  username: string;
  email: string;
  name?: string;
  profilePicture?: string;
}

const UnifiedHeader = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      getMe(token)
        .then(data => {
          if (data.status === "success") {
            setUserData(data.data.user);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    toast.success("Signed out successfully");
    navigate("/");
  };

  const displayName = userData?.name || userData?.username || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-full">
      {/* Top Bar (Universal & Fixed) */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="font-display text-2xl font-bold tracking-tight text-foreground shrink-0">
            clueless
          </Link>

          <div className="flex items-center gap-8 md:gap-12">
            <div className="hidden sm:flex items-center gap-10">
              <Link to="/wardrobe" className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5">
                <Shirt className="w-4 h-4" />
                Wardrobe
              </Link>
              <Link to="/wishlist" className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                Wishlist
              </Link>
              <Link to="/moodboard" className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4" />
                Moodboard
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-secondary text-gold font-display font-bold">{userInitial}</AvatarFallback>
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

      {/* Page Heading & Back Button (Non-fixed, flows with page) */}
      <div className="container mx-auto px-6 pt-20 mb-12">
        <div className="relative flex flex-col items-center gap-6">
          {/* Left: Simple Back Button (Relative to content) */}
          <div className="absolute left-0 top-0">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 font-body text-muted-foreground hover:text-foreground px-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="uppercase tracking-[0.2em] text-[10px] font-black">Back</span>
            </Button>
          </div>

          {/* Center: Large Italic Page Title (Matching Best Fits style) */}
          <h1 className="font-display text-6xl font-bold italic text-foreground/90 tracking-tighter text-center">
            {title}
          </h1>
          
          <div className="w-24 h-[1px] bg-[#D4AF37]/20" />
        </div>
      </div>
    </div>
  );
};

export default UnifiedHeader;

