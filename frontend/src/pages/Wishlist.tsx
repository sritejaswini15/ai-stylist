import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UnifiedHeader from "@/components/UnifiedHeader";
import { WishlistItem } from "@/types";
import { getApiUrl } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(getApiUrl("/api/users/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.status === "success") {
          setWishlist(data.data.user.wishlist);
        }
      } catch (error) {
        toast.error("Failed to fetch wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/wishlist/${itemId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === "success") {
        setWishlist(data.data.wishlist);
        toast.success("Item removed");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body">
      <UnifiedHeader title="Wishlist" />

      <main className="container mx-auto px-6 pt-8 pb-24">
        {wishlist.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-black/10">
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-8">Save items you love to see them here.</p>
            <Button onClick={() => navigate("/dashboard")} className="bg-gold hover:bg-gold/90 text-white rounded-full px-8">
              Explore Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <button 
              onClick={() => navigate("/find-outfits")}
              className="flex flex-col items-center justify-center aspect-[3/4] rounded-[2.5rem] border-2 border-dashed border-border bg-white hover:border-gold hover:bg-secondary/30 transition-all duration-500 group"
            >
              <div className="p-4 rounded-full bg-secondary group-hover:bg-gold/10 transition-colors">
                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors" />
              </div>
              <span className="text-sm font-display font-bold text-muted-foreground group-hover:text-gold mt-4 uppercase tracking-widest text-center px-4">Find More Outfits</span>
            </button>
            {wishlist.map((item, i) => (
              <div key={item._id || i} className="group aspect-[3/4] rounded-[2.5rem] bg-white overflow-hidden relative shadow-sm hover:shadow-2xl transition-all duration-500 border border-black/5 hover:-translate-y-2">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-start justify-end p-4 z-20">
                  {item._id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button 
                          className="p-2 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 rounded-full shadow-lg transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-auto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2rem] bg-white border-none shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-display text-2xl font-bold">Remove from Wishlist?</AlertDialogTitle>
                          <AlertDialogDescription className="font-body text-muted-foreground">
                            This will remove "{item.title}" from your saved items. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full border-black/5 font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteItem(item._id!)}
                            className="rounded-full bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-[10px]"
                          >
                            Remove Item
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 z-10 pointer-events-none">
                   <p className="text-white text-xs font-display font-bold line-clamp-2 mb-2 pointer-events-auto">{item.title}</p>
                   {item.link && (
                     <a 
                       href={item.link} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="text-[10px] text-gold font-black uppercase tracking-widest hover:underline flex items-center gap-2 pointer-events-auto"
                     >
                       Shop Now
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                     </a>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
