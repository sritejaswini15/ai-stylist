import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Camera, 
  Sparkles,
  Settings,
  Save,
  X,
  Star,
  Shirt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import UnifiedHeader from "@/components/UnifiedHeader";

import { ClothingItem, Outfit, UserProfile } from "@/types";
import { getApiUrl } from "@/services/api";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditingInitial = searchParams.get("edit") === "true";
  
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(isEditingInitial);
  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    profilePicture: ""
  });

  const token = localStorage.getItem("token");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setEditForm({ ...editForm, profilePicture: base64String });
    };
    reader.readAsDataURL(file);
  };

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
          setUserData(data.data.user);
          setEditForm({
            name: data.data.user.name || "",
            age: data.data.user.age?.toString() || "",
            profilePicture: data.data.user.profilePicture || ""
          });
        }
      } catch (error) {
        toast.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(getApiUrl("/api/users/updateMe"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          age: parseInt(editForm.age) || undefined,
          profile_picture: editForm.profilePicture
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setUserData(data.data.user);
        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div></div>;
  if (!userData) return null;

  const displayName = userData.name || userData.username;
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body">
      <UnifiedHeader title="Profile" />

      <main className="pt-8 pb-20 px-6">
        <div className="container mx-auto max-w-5xl bg-white rounded-[3rem] p-12 shadow-xl shadow-black/5 border border-black/5 relative">
          <div className="absolute top-12 right-12">
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full border-gold text-gold hover:bg-gold hover:text-white font-body px-6">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-16">
            <div className="relative group">
              <Avatar className="h-40 w-40 border-4 border-white shadow-2xl">
                <AvatarImage src={isEditing ? editForm.profilePicture : userData.profilePicture} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-secondary text-gold text-5xl font-display">{userInitial}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-10 h-10 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-6">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md mx-auto md:mx-0">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="name" className="font-display font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Display Name</Label>
                    <Input 
                      id="name" 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Your Name"
                      className="rounded-2xl border-border focus:ring-gold h-12"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="age" className="font-display font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Age</Label>
                    <Input 
                      id="age" 
                      type="number"
                      value={editForm.age} 
                      onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                      placeholder="Your Age"
                      className="rounded-2xl border-border focus:ring-gold h-12"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="bg-gold text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-gold/20">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-full h-12 px-6">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <h1 className="font-display text-5xl font-bold text-foreground mb-2">{displayName}</h1>
                    <p className="text-muted-foreground font-body text-lg italic">@{userData.username} • {userData.age || '?'} years old</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-12 py-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <Shirt className="w-8 h-8 text-gold" />
                      </div>
                      <p className="font-display text-3xl font-bold text-foreground mb-1">{(userData.clothesOwned || []).length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black">Wardrobe</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="moodboard" className="w-full">
            <TabsList className="w-full flex justify-center bg-secondary/30 rounded-3xl h-16 p-2 mb-12">
              <TabsTrigger value="moodboard" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 rounded-2xl h-full font-display font-bold uppercase tracking-widest text-xs transition-all">
                <Sparkles className="w-4 h-4 mr-2" />
                Moodboard
              </TabsTrigger>
              <TabsTrigger value="best" className="data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-1 rounded-2xl h-full font-display font-bold uppercase tracking-widest text-xs transition-all">
                <Star className="w-4 h-4 mr-2" />
                Best Fits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="moodboard" className="mt-0 outline-none">
               {userData.fashionInspoBoard.length === 0 ? (
                 <div className="text-center py-20 border-2 border-dashed border-border rounded-[2.5rem]">
                   <p className="text-muted-foreground italic">Your moodboard is empty</p>
                 </div>
               ) : (
                 <div className="columns-2 md:columns-3 gap-6 space-y-6">
                  {userData.fashionInspoBoard.map((item, i) => (
                    <div key={i} className="rounded-[2.5rem] overflow-hidden group relative break-inside-avoid shadow-sm hover:shadow-2xl transition-all duration-700 border border-black/5">
                      <img src={item.imageUrl} alt="Inspiration" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  ))}
                </div>
               )}
            </TabsContent>

            <TabsContent value="best" className="mt-0 outline-none">
               {userData.bestOutfits.length === 0 ? (
                 <div className="text-center py-20 border-2 border-dashed border-border rounded-[2.5rem]">
                   <p className="text-muted-foreground italic">No best fits saved yet</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {userData.bestOutfits.map((outfit, i) => {
                    const topItem = userData.clothesOwned.find(c => c._id === outfit.topId) || userData.clothesOwned.find(c => c._id === outfit.dressId);
                    const bottomItem = userData.clothesOwned.find(c => c._id === outfit.bottomId);
                    const shoeItem = userData.clothesOwned.find(c => c._id === outfit.shoesId);

                    return (
                      <div key={i} className="bg-white rounded-[2.5rem] p-6 flex flex-col items-center justify-center space-y-[-15%] relative overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-black/5 aspect-[3/4]">
                        <div className="w-full h-24 flex items-center justify-center z-20">
                          {topItem && <img src={topItem.imageUrl} className="max-h-full object-contain mix-blend-multiply" alt="Top" />}
                        </div>
                        {bottomItem && (
                          <div className="w-full h-28 flex items-center justify-center z-10">
                            <img src={bottomItem.imageUrl} className="max-h-full object-contain mix-blend-multiply" alt="Bottom" />
                          </div>
                        )}
                        <div className="w-full h-12 flex items-end justify-center z-0 pt-2">
                          {shoeItem && <img src={shoeItem.imageUrl} className="max-h-full object-contain mix-blend-multiply" alt="Shoes" />}
                        </div>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      </div>
                    );
                  })}
                </div>
               )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;