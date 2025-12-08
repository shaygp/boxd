import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { createList } from "@/services/lists";
import { getUserProfile } from "@/services/auth";
import { useToast } from "@/hooks/use-toast";

interface CreateListDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (listId: string) => void;
}

export const CreateListDialog = ({ trigger, onSuccess }: CreateListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!user || !title) {
      toast({
        title: "Missing fields",
        description: "Please enter a title for your list",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch user profile to get username
      const profile = await getUserProfile(user.uid);
      const username = profile?.username || profile?.name || user.displayName || 'User';
      const userProfileImageUrl = profile?.photoURL || user.photoURL || '';

      const listId = await createList({
        userId: user.uid,
        username,
        userProfileImageUrl,
        title,
        description,
        races: [],
        isPublic,
        tags: [],
      });

      toast({ title: "List created successfully!" });
      setOpen(false);

      setTitle("");
      setDescription("");
      setIsPublic(true);

      // Navigate to the created list or call onSuccess callback
      if (onSuccess) {
        onSuccess(listId);
      } else {
        navigate(`/list/${listId}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Create List</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full bg-black/95 border-2 border-racing-red backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-wider text-racing-red">Create New List</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-bold uppercase tracking-wider text-sm">Title *</Label>
            <Input
              id="title"
              placeholder="Best Races of 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white font-bold uppercase tracking-wider text-sm">Description</Label>
            <Textarea
              id="description"
              placeholder="A collection of the most exciting races..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-black/40 border-2 border-red-900/40 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="public" className="text-white font-bold uppercase tracking-wider text-sm">Public List</Label>
              <p className="text-xs text-gray-400 font-medium">
                Allow others to see this list
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || !title}
              className="flex-1 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-500/30"
            >
              {loading ? "Creating..." : "Create List"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="bg-black/60 border-2 border-gray-700 text-white hover:bg-black/80 hover:text-white font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
