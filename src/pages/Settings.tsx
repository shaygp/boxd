import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, Download, Mail, Heart, Ban, X } from "lucide-react";
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
import { auth } from "@/lib/firebase";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { resendVerificationEmail } from "@/services/auth";
import { getBlockedUsers, unblockUser } from "@/services/reports";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [likesNotifications, setLikesNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [favoriteDriver, setFavoriteDriver] = useState("");
  const [favoriteCircuit, setFavoriteCircuit] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; name: string; username: string; photoURL?: string }>>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const statsDoc = await getDoc(doc(db, "userStats", user.uid));
        if (statsDoc.exists()) {
          const data = statsDoc.data();
          setFavoriteDriver(data.favoriteDriver || "");
          setFavoriteCircuit(data.favoriteCircuit || "");
          setFavoriteTeam(data.favoriteTeam || "");

          // Load notification settings
          setEmailNotifications(data.emailNotifications ?? true);
          setPushNotifications(data.pushNotifications ?? true);
          setLikesNotifications(data.likesNotifications ?? true);
          setFollowNotifications(data.followNotifications ?? true);

          // Load privacy settings
          setPrivateAccount(data.privateAccount ?? false);
          setShowActivityStatus(data.showActivityStatus ?? true);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }

      // Load blocked users
      await loadBlockedUsers();
    };

    loadSettings();
  }, [user]);

  const loadBlockedUsers = async () => {
    if (!user) return;

    setLoadingBlocked(true);
    try {
      const blockedIds = await getBlockedUsers();

      // Fetch user details for each blocked user
      const blockedUsersDetails = await Promise.all(
        blockedIds.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: userId,
                name: userData.name || 'User',
                username: userData.username || 'user',
                photoURL: userData.photoURL
              };
            }
            return {
              id: userId,
              name: 'User',
              username: 'user'
            };
          } catch (error) {
            console.error('Error fetching blocked user details:', error);
            return {
              id: userId,
              name: 'User',
              username: 'user'
            };
          }
        })
      );

      setBlockedUsers(blockedUsersDetails);
    } catch (error) {
      console.error("Error loading blocked users:", error);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await unblockUser(userId);
      toast({
        title: "User unblocked",
        description: "User has been removed from your blocked list",
      });
      await loadBlockedUsers(); // Reload the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user || !currentPassword || !newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });

      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        deletePassword
      );
      await reauthenticateWithCredential(user, credential);

      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", user.uid));
      await deleteDoc(doc(db, "userStats", user.uid));

      // Delete user's race logs
      const logsQuery = query(
        collection(db, "raceLogs"),
        where("userId", "==", user.uid)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const deletePromises = logsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Delete user's lists
      const listsQuery = query(
        collection(db, "lists"),
        where("userId", "==", user.uid)
      );
      const listsSnapshot = await getDocs(listsQuery);
      const deleteListsPromises = listsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteListsPromises);

      // Delete Firebase Auth user
      await deleteUser(user);

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      toast({
        title: "Verification email sent",
        description: "Check your inbox for the verification link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    toast({
      title: "Export data",
      description: "This feature is coming soon",
    });
  };

  const handleSaveFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "userStats", user.uid), {
        favoriteDriver,
        favoriteCircuit,
        favoriteTeam,
      });

      toast({
        title: "Favorites saved",
        description: "Your F1 favorites have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "userStats", user.uid), {
        emailNotifications,
        pushNotifications,
        likesNotifications,
        followNotifications,
      });

      toast({
        title: "Notifications saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "userStats", user.uid), {
        privateAccount,
        showActivityStatus,
      });

      toast({
        title: "Privacy settings saved",
        description: "Your privacy preferences have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Account</h2>
              <p className="text-sm text-muted-foreground">
                Manage your account settings
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.email}
                </p>
                {!user?.emailVerified && (
                  <Button
                    variant="link"
                    className="px-0 text-racing-red"
                    onClick={handleResendVerification}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Resend verification email
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              >
                Change Password
              </Button>
            </div>
          </Card>

          {/* F1 Favorites Section */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-racing-red" />
                F1 Favorites
              </h2>
              <p className="text-sm text-muted-foreground">
                Set your favorite driver, circuit, and team
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="favoriteDriver">Favorite Driver</Label>
                <Input
                  id="favoriteDriver"
                  value={favoriteDriver}
                  onChange={(e) => setFavoriteDriver(e.target.value)}
                  placeholder="e.g., Pierre Gasly"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favoriteCircuit">Favorite Circuit</Label>
                <Input
                  id="favoriteCircuit"
                  value={favoriteCircuit}
                  onChange={(e) => setFavoriteCircuit(e.target.value)}
                  placeholder="e.g., Marina Bay"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="favoriteTeam">Favorite Team</Label>
                <Input
                  id="favoriteTeam"
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  placeholder="e.g., Alpine"
                  maxLength={50}
                />
              </div>

              <Button onClick={handleSaveFavorites} disabled={loading}>
                Save Favorites
              </Button>
            </div>
          </Card>

          {/* Privacy Section */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Privacy</h2>
              <p className="text-sm text-muted-foreground">
                Control who can see your content
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Private Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Only approved followers can see your content
                  </p>
                </div>
                <Switch
                  checked={privateAccount}
                  onCheckedChange={setPrivateAccount}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show Activity Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you're active
                  </p>
                </div>
                <Switch
                  checked={showActivityStatus}
                  onCheckedChange={setShowActivityStatus}
                />
              </div>

              <Button onClick={handleSavePrivacy} disabled={loading}>
                Save Privacy Settings
              </Button>
            </div>
          </Card>

          {/* Blocked Users Section */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
                <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                Blocked Users
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage users you've blocked from interacting with you
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              {loadingBlocked ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading blocked users...
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  You haven't blocked any users
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((blockedUser) => (
                    <div
                      key={blockedUser.id}
                      className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-black/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden">
                          {blockedUser.photoURL ? (
                            <img
                              src={blockedUser.photoURL}
                              alt={blockedUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {blockedUser.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{blockedUser.name}</p>
                          <p className="text-sm text-muted-foreground">@{blockedUser.username}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblockUser(blockedUser.id)}
                        className="border-gray-600 hover:bg-gray-800"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Notifications Section */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Choose what you want to be notified about
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Likes & Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone likes or comments on your content
                  </p>
                </div>
                <Switch
                  checked={likesNotifications}
                  onCheckedChange={setLikesNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>New Followers</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone follows you
                  </p>
                </div>
                <Switch
                  checked={followNotifications}
                  onCheckedChange={setFollowNotifications}
                />
              </div>

              <Button onClick={handleSaveNotifications} disabled={loading}>
                Save Notification Settings
              </Button>
            </div>
          </Card>

          {/* Data & Privacy Section */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Data & Privacy</h2>
              <p className="text-sm text-muted-foreground">
                Manage your data and privacy settings
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Download a copy of your data
                </p>
              </div>

              <div>
                <p className="text-sm mb-2">
                  <a href="/privacy-policy" className="text-racing-red hover:underline">
                    Privacy Policy
                  </a>
                  {" • "}
                  <a href="/terms-of-service" className="text-racing-red hover:underline">
                    Terms of Service
                  </a>
                </p>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 space-y-6 border-destructive">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">
                Irreversible actions
              </p>
            </div>

            <Separator />

            <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                      </p>
                      <p className="font-semibold">All of the following will be deleted:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your profile and account information</li>
                        <li>All your race logs and reviews</li>
                        <li>All your lists and collections</li>
                        <li>All your likes and comments</li>
                        <li>Your followers and following connections</li>
                      </ul>
                      <div className="space-y-2 pt-4">
                        <Label>Enter your password to confirm</Label>
                        <Input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={loading || !deletePassword}
                    >
                      {loading ? "Deleting..." : "Yes, delete my account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground mt-2">
                Once you delete your account, there is no going back
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
