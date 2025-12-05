import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, uploadProfilePicture, validateUsername, checkUsernameAvailability } from "@/services/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Edit, Camera, X, Trash2, AtSign } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditProfileDialogProps {
  profile: any;
  onSuccess?: () => void;
}

export const EditProfileDialog = ({ profile, onSuccess }: EditProfileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [favoriteDriver, setFavoriteDriver] = useState("");
  const [favoriteCircuit, setFavoriteCircuit] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadProfileData = async () => {
      if (profile) {
        setName(profile.name || "");
        setUsername(profile.username || "");
        setOriginalUsername(profile.username || "");
        setDescription(profile.description || "");
        setPhotoPreview(profile.photoURL || null);

        // Load favorites from userStats
        if (user) {
          try {
            const statsDoc = await getDoc(doc(db, 'userStats', user.uid));
            if (statsDoc.exists()) {
              const statsData = statsDoc.data();
              setFavoriteDriver(statsData.favoriteDriver || "");
              setFavoriteCircuit(statsData.favoriteCircuit || "");
              setFavoriteTeam(statsData.favoriteTeam || "");
            }
          } catch (error) {
            console.error('Error loading userStats:', error);
          }
        }
      }
    };

    loadProfileData();
  }, [profile, user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(profile?.photoURL || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setUsernameError('');

    if (value.length === 0) {
      setUsernameError('Username is required');
      return;
    }

    // If username hasn't changed, no need to validate
    if (value === originalUsername) {
      return;
    }

    const cleanUsername = value.replace(/^@/, '').toLowerCase();
    const validation = validateUsername(cleanUsername);

    if (!validation.valid) {
      setUsernameError(validation.error || 'Invalid username');
      return;
    }

    // Check availability
    const isAvailable = await checkUsernameAvailability(cleanUsername);
    if (!isAvailable) {
      setUsernameError('Username is already taken');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      });
      return;
    }

    if (usernameError) {
      toast({
        title: "Error",
        description: usernameError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('[EditProfileDialog] Starting profile update...', {
        hasPhotoFile: !!photoFile,
        name: name.trim(),
        description: description.trim()
      });

      let photoURL = profile?.photoURL;

      // Upload photo if changed - make this optional, don't block the update
      if (photoFile) {
        try {
          console.log('[EditProfileDialog] Uploading photo...');
          photoURL = await uploadProfilePicture(user.uid, photoFile);
          console.log('[EditProfileDialog] Photo uploaded successfully:', photoURL);
        } catch (uploadError: any) {
          console.error('[EditProfileDialog] Photo upload failed, continuing anyway:', uploadError);
          toast({
            title: "Photo upload failed",
            description: "Saving other changes...",
            variant: "destructive",
          });
        }
      }

      const cleanUsername = username.replace(/^@/, '').toLowerCase();

      const updates: any = {
        name: name.trim(),
        username: cleanUsername,
        description: description.trim(),
      };

      if (photoURL) {
        Object.assign(updates, { photoURL });
      }

      console.log('[EditProfileDialog] Updating profile with:', updates);
      await updateUserProfile(user.uid, updates);

      // Update favorites in userStats
      try {
        const statsRef = doc(db, 'userStats', user.uid);
        await setDoc(statsRef, {
          favoriteDriver: favoriteDriver.trim(),
          favoriteCircuit: favoriteCircuit.trim(),
          favoriteTeam: favoriteTeam.trim(),
        }, { merge: true });
        console.log('[EditProfileDialog] Favorites updated successfully!');
      } catch (error) {
        console.error('[EditProfileDialog] Error updating favorites:', error);
      }

      console.log('[EditProfileDialog] Profile updated successfully!');

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      setOpen(false);

      // Refresh the profile data
      if (onSuccess) {
        onSuccess();
      } else {
        // Force page reload to show updated data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('[EditProfileDialog] Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Delete user's account
      await user.delete();

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });

      // Redirect to login
      window.location.href = '/login';
    } catch (error: any) {
      console.error('[EditProfileDialog] Error deleting account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. You may need to re-authenticate.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 text-xs">
          <Edit className="w-3.5 h-3.5" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm w-[90vw] sm:w-full bg-black border-2 border-racing-red/40 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-900 border-2 border-racing-red/40 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    {(name || profile?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 border-racing-red/40 bg-black/60 text-white hover:bg-racing-red/20"
                >
                  <Camera className="w-4 h-4" />
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {photoFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePhoto}
                    className="gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Recommended: Square image, max 5MB
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              required
              className="bg-black/60 border-racing-red/40 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">
              {name.length}/50 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">Username *</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your_username"
                maxLength={20}
                required
                className={`pl-10 bg-black/60 border ${
                  usernameError
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-racing-red/40'
                } text-white placeholder:text-gray-500`}
              />
            </div>
            {usernameError && (
              <p className="text-xs text-red-500">{usernameError}</p>
            )}
            {username && !usernameError && username !== originalUsername && (
              <p className="text-xs text-green-500">Username is available!</p>
            )}
            <p className="text-xs text-gray-500">
              3-20 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Bio</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about yourself and your love for F1..."
              className="min-h-[100px] resize-none bg-black/60 border-racing-red/40 text-white placeholder:text-gray-500"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {description.length}/500 characters
            </p>
          </div>

          {/* Favorites Section */}
          <div className="pt-4 space-y-4 border-t border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Favorites</h3>

            <div className="space-y-2">
              <Label htmlFor="favoriteDriver" className="text-gray-300">Favorite Driver</Label>
              <Input
                id="favoriteDriver"
                value={favoriteDriver}
                onChange={(e) => setFavoriteDriver(e.target.value)}
                placeholder="e.g., Max Verstappen"
                maxLength={50}
                className="bg-black/60 border-racing-red/40 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteCircuit" className="text-gray-300">Favorite Circuit</Label>
              <Input
                id="favoriteCircuit"
                value={favoriteCircuit}
                onChange={(e) => setFavoriteCircuit(e.target.value)}
                placeholder="e.g., Spa-Francorchamps"
                maxLength={50}
                className="bg-black/60 border-racing-red/40 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteTeam" className="text-gray-300">Favorite Team</Label>
              <Input
                id="favoriteTeam"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
                placeholder="e.g., Red Bull Racing"
                maxLength={50}
                className="bg-black/60 border-racing-red/40 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-600 bg-transparent text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-racing-red hover:bg-red-600 text-white">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Delete Account Section */}
          <div className="pt-6 mt-6 border-t border-gray-800">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">Danger Zone</h3>
              <p className="text-xs text-gray-500">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full gap-2 bg-red-900/20 border border-red-900/40 text-red-500 hover:bg-red-900/30 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black border-2 border-red-900/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete your account
              and remove all your data including race logs, reviews, and lists from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 bg-transparent text-white hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
