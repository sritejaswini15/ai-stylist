import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Shirt, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UnifiedHeader from "@/components/UnifiedHeader";
import { getApiUrl } from "@/services/api";

const AddClothes = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: files.length });
    const token = localStorage.getItem("token");
    
    if (!token) {
      toast.error("You must be logged in to upload clothes");
      navigate("/signin");
      setLoading(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    try {
      // Convert and upload one by one to save memory and handle errors individually
      for (let i = 0; i < files.length; i++) {
        try {
          const base64Image = await fileToBase64(files[i]);
          const response = await fetch(getApiUrl("/api/clothing/upload"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              image_base64: base64Image
            }),
          });

          if (response.ok) {
            successCount++;
            setProgress(prev => ({ ...prev, current: i + 1 }));
          } else {
            failCount++;
            if (response.status === 401) {
              toast.error("Session expired. Please log in again.");
              localStorage.removeItem("token");
              navigate("/signin");
              return;
            }
            const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
            toast.error(`Failed to upload ${files[i].name}: ${errorData.detail}`);
          }
        } catch (err) {
          failCount++;
          toast.error(`Error processing ${files[i].name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} item${successCount > 1 ? "s" : ""} to your wardrobe!`);
        setFiles([]);
        setTimeout(() => navigate("/wardrobe"), 1500);
      } else if (failCount > 0) {
        toast.error("Failed to upload all items. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during preparation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body">
      <UnifiedHeader title="Add Clothes" />

      <main className="container mx-auto max-w-4xl pt-8 pb-20 px-6">
        <div className="bg-white rounded-[3rem] shadow-xl shadow-black/5 border border-black/5 p-12">
          <div className="max-w-xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-secondary/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Shirt className="w-10 h-10 text-gold" />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground">Upload to Wardrobe</h2>
              <p className="text-muted-foreground text-lg">Our AI will automatically categorize your items.</p>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-[2.5rem] p-16 transition-all duration-300 flex flex-col items-center justify-center gap-6 
                ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gold/50 hover:bg-secondary/30"}
                ${dragActive ? "border-gold bg-gold/5 scale-[1.02]" : "border-border"}`}
              onDragEnter={!uploading ? handleDrag : undefined}
              onDragLeave={!uploading ? handleDrag : undefined}
              onDragOver={!uploading ? handleDrag : undefined}
              onDrop={!uploading ? handleDrop : undefined}
              onClick={() => !uploading && document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-display text-xl font-bold mb-1">Drop images here</p>
                <p className="text-muted-foreground">or click to browse from your device</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-2">
                  <p className="font-display font-bold text-lg">{files.length} items selected</p>
                  {!uploading && (
                    <button 
                      onClick={() => setFiles([])}
                      className="text-xs font-bold text-destructive uppercase tracking-widest hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="group relative aspect-square bg-secondary/30 rounded-2xl overflow-hidden border border-border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {!uploading && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full h-16 rounded-2xl text-lg font-bold bg-gold hover:bg-gold/90 text-white shadow-lg shadow-gold/20"
                >
                  {uploading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processing {progress.current}/{progress.total}...</span>
                    </div>
                  ) : (
                    "Complete Upload"
                  )}
                </Button>
              </div>
            )}

            {uploading && (
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gold h-full transition-all duration-500" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddClothes;
