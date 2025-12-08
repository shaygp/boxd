import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateList } from "@/services/lists";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Edit, Camera } from "lucide-react";

interface EditListDialogProps {
  trigger?: React.ReactNode;
  list: any;
  onSuccess?: () => void;
}

export const EditListDialog = ({ trigger, list, onSuccess }: EditListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(list.title || "");
  const [description, setDescription] = useState(list.description || "");
  const [isPublic, setIsPublic] = useState(list.isPublic || false);
  const [tags, setTags] = useState(list.tags?.join(", ") || "");
  const [listImageUrl, setListImageUrl] = useState(list.listImageUrl || "");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${list.id}_${timestamp}`;
      const storageRef = ref(storage, `list-covers/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setListImageUrl(downloadURL);
      toast({
        title: "Image uploaded!",
        description: "List cover image has been updated"
      });
    } catch (error: any) {
      console.error('[EditListDialog] Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        listImageUrl: listImageUrl || ""
      };

      await updateList(list.id, updates);

      toast({
        title: "List updated!",
        description: "Your list has been updated successfully"
      });

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('[EditListDialog] Error updating list:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase tracking-wider">
            <Edit className="w-4 h-4" />
            Edit List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full bg-black/95 border-2 border-racing-red backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-wider text-racing-red">Edit List</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* List Cover Image */}
          <div className="space-y-3">
            <Label className="text-white font-bold uppercase tracking-wider text-sm">Cover Image</Label>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-red-900/50 bg-black/60">
                {listImageUrl ? (
                  <img
                    src={listImageUrl}
                    alt="List cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Camera className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 bg-racing-red hover:bg-red-600"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Camera className="w-4 h-4" />
                    {uploadingImage ? "Uploading..." : "Change Image"}
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-400">
                Recommended: 1200x400px or 3:1 aspect ratio (max 5MB)
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-bold uppercase tracking-wider text-sm">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My F1 List"
              required
              className="bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-bold uppercase tracking-wider text-sm">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people about this list..."
              rows={4}
              className="bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-white font-bold uppercase tracking-wider text-sm">
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="season2024, classics, favorites (comma-separated)"
              className="bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
            />
            <p className="text-xs text-gray-400">Separate tags with commas</p>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/60 border-2 border-red-900/50">
            <div className="space-y-0.5">
              <Label htmlFor="public" className="text-white font-bold uppercase tracking-wider text-sm">
                Public List
              </Label>
              <p className="text-xs text-gray-400">
                Make this list visible to everyone
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="data-[state=checked]:bg-racing-red"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 bg-black/60 border-2 border-gray-700 text-white hover:bg-black/80 hover:text-white font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-500/30"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
