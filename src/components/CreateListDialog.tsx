import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { createList } from "@/services/lists";
import { useToast } from "@/hooks/use-toast";

interface CreateListDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const CreateListDialog = ({ trigger, onSuccess }: CreateListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

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
      await createList({
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'User',
        userProfileImageUrl: user.photoURL || '',
        title,
        description,
        races: [],
        isPublic,
        tags: [],
      });

      toast({ title: "List created successfully!" });
      setOpen(false);
      onSuccess?.();

      setTitle("");
      setDescription("");
      setIsPublic(true);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Best Races of 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A collection of the most exciting races..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="public">Public List</Label>
              <p className="text-sm text-muted-foreground">
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
            <Button onClick={handleSubmit} disabled={loading || !title} className="flex-1">
              {loading ? "Creating..." : "Create List"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
