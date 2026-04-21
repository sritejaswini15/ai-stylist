import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import UnifiedHeader from "@/components/UnifiedHeader";
import { InspoItem } from "@/types";
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

const Moodboard = () => {
  const navigate = useNavigate();
  const [inspoBoard, setInspoBoard] = useState<InspoItem[]>([]);
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
          setInspoBoard(data.data.user.fashionInspoBoard);
        }
      } catch (error) {
        toast.error("Failed to fetch moodboard");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      addItem(base64String);
    };
    reader.readAsDataURL(file);
  };

  const addItem = async (imageUrl: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/inspo`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setInspoBoard(data.data.inspoBoard);
        toast.success("Inspiration added!");
      }
    } catch (error) {
      toast.error("Failed to add inspiration");
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/inspo/${itemId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === "success") {
        setInspoBoard(data.data.inspoBoard);
        toast.success("Item removed");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body">
      <UnifiedHeader title="Moodboard" />

      <main className="container mx-auto px-6 pt-8 pb-24">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
          <label className="flex flex-col items-center justify-center w-full aspect-square rounded-[2.5rem] border-2 border-dashed border-border bg-white hover:border-gold hover:bg-secondary/30 transition-all duration-500 cursor-pointer group break-inside-avoid mb-8">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-4 rounded-full bg-secondary group-hover:bg-gold/10 transition-colors">
                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-gold transition-colors" />
              </div>
              <span className="text-sm font-display font-bold text-muted-foreground group-hover:text-gold uppercase tracking-widest mt-4">Upload Inspo</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          
          {inspoBoard.map((item, i) => (
            <div key={item._id || i} className="rounded-[2.5rem] bg-white overflow-hidden group relative break-inside-avoid shadow-sm hover:shadow-2xl transition-all duration-700 border border-black/5 hover:-translate-y-2">
              <img src={item.imageUrl} alt="Inspiration" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-start justify-end p-4">
                {item._id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button 
                        className="p-2 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 rounded-full shadow-lg transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2rem] bg-white border-none shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-2xl font-bold">Remove Inspiration?</AlertDialogTitle>
                        <AlertDialogDescription className="font-body text-muted-foreground">
                          This will remove this image from your moodboard. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full border-black/5 font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteItem(item._id!)}
                          className="rounded-full bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-[10px]"
                        >
                          Remove Inspo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Moodboard;
