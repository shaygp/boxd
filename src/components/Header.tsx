import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogRaceDialog } from "@/components/LogRaceDialog";
import { Search, Plus, User, Bell, LogOut, Settings, Menu, X, Home, Compass, Activity, Calendar, Eye, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount } from "@/services/notifications";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(user.uid),
        getUnreadNotificationsCount(user.uid)
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notification.linkTo) {
      navigate(notification.linkTo);
    }
    setNotificationsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.uid);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const loadUserPhoto = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPhotoURL(userData.photoURL || user.photoURL || null);
        } else {
          setUserPhotoURL(user.photoURL || null);
        }
      } catch (error) {
        console.error('Error loading user photo:', error);
        setUserPhotoURL(user.photoURL || null);
      }
    };
    loadUserPhoto();
  }, [user]);

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 border-racing-red/20 bg-black/90 backdrop-blur-xl shadow-lg shadow-red-900/10">
        <div className="container flex h-16 md:h-18 items-center px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6 md:gap-8 flex-1">
            <a href="/home" className="flex items-center">
              <div className="text-xl sm:text-2xl font-black tracking-tighter">
                <span className="text-white">BOX</span>
                <span className="text-racing-red">BOXD</span>
              </div>
            </a>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-black uppercase tracking-wider ml-4 lg:ml-6">
            <a href="/home" className="text-white hover:text-racing-red transition-colors">
              Home
            </a>
            <a href="/explore" className="text-gray-400 hover:text-racing-red transition-colors">
              Explore
            </a>
            <a href="/lists" className="text-gray-400 hover:text-racing-red transition-colors">
              Activity
            </a>
            <a href="/diary" className="text-gray-400 hover:text-racing-red transition-colors">
              Diary
            </a>
            <a href="/watchlist" className="text-gray-400 hover:text-racing-red transition-colors">
              Watchlist
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          <form onSubmit={handleSearch} className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-white" />
            <Input
              type="search"
              placeholder="Search races, users..."
              className="pl-9 lg:pl-11 w-48 xl:w-64 bg-black/60 border-2 border-red-900/50 !text-white placeholder:text-gray-400 focus:border-racing-red lg:h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden text-white hover:text-white"
            onClick={() => navigate('/search')}
          >
            <Search className="w-5 h-5 !text-white" />
          </Button>

          <LogRaceDialog
            trigger={
              <Button size="sm" className="gap-2 bg-racing-red hover:bg-red-600 shadow-lg shadow-red-500/30 border-2 border-red-400 font-black uppercase tracking-wider md:h-11 md:px-6 hidden lg:flex">
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Log</span>
              </Button>
            }
            open={logDialogOpen}
            onOpenChange={setLogDialogOpen}
          />

          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="relative md:w-11 md:h-11">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-racing-red text-white text-xs rounded-full flex items-center justify-center font-black shadow-lg shadow-red-500/50">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={12} className="w-80 max-w-[calc(100vw-2rem)] bg-black/95 border-2 border-red-900/40 backdrop-blur-xl mt-2">
              <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/40">
                <span className="font-black text-white uppercase tracking-wider text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-racing-red hover:text-white hover:bg-racing-red/20 font-bold uppercase"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px]">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex items-start gap-3 p-4 cursor-pointer hover:bg-racing-red/10 border-b border-red-900/20 focus:bg-racing-red/10"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {notification.actorPhotoURL ? (
                          <img src={notification.actorPhotoURL} alt={notification.actorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-sm font-black text-white uppercase">
                            {notification.actorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">
                          <span className="font-bold text-white">{notification.actorName}</span>
                          {' '}
                          <span className="text-gray-400">{notification.content}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-racing-red rounded-full flex-shrink-0 mt-2 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm font-bold uppercase tracking-wider">
                    No notifications yet
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="relative rounded-full md:w-11 md:h-11 touch-manipulation cursor-pointer"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {userPhotoURL ? (
                  <img
                    src={userPhotoURL}
                    alt="Profile"
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-racing-red/20 flex items-center justify-center text-racing-red font-bold md:text-lg pointer-events-none">
                    {(user?.displayName || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="touch-manipulation min-w-[220px] bg-black/95 border-2 border-red-900/40 backdrop-blur-xl mt-2" sideOffset={12}>
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="cursor-pointer py-3 px-4 text-base font-bold text-white hover:bg-racing-red/10 hover:text-racing-red focus:bg-racing-red/10 focus:text-racing-red uppercase tracking-wider"
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/wrapped')}
                className="cursor-pointer py-3 px-4 text-base bg-gradient-to-r from-racing-red/20 to-transparent hover:from-racing-red/30 focus:from-racing-red/30 border-l-2 border-racing-red"
              >
                <Sparkles className="w-5 h-5 mr-3 text-racing-red" />
                <span className="font-black text-racing-red uppercase tracking-wider">Formula Wrapped</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/settings')}
                className="cursor-pointer py-3 px-4 text-base font-bold text-white hover:bg-racing-red/10 hover:text-racing-red focus:bg-racing-red/10 focus:text-racing-red uppercase tracking-wider"
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-red-900/40" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer py-3 px-4 text-base font-bold text-gray-400 hover:bg-red-900/20 hover:text-white focus:bg-red-900/20 focus:text-white uppercase tracking-wider"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation */}
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-black/95 backdrop-blur-xl border-t-2 border-racing-red/20 shadow-lg shadow-red-900/20">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => navigate('/home')}
          className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
            isActivePath('/home') ? 'text-racing-red' : 'text-gray-400'
          }`}
        >
          <Home className={`w-6 h-6 ${isActivePath('/home') ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''}`} />
          <span className="text-xs font-black uppercase tracking-wider mt-1">Home</span>
        </button>

        <button
          onClick={() => navigate('/explore')}
          className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
            isActivePath('/explore') ? 'text-racing-red' : 'text-gray-400'
          }`}
        >
          <Compass className={`w-6 h-6 ${isActivePath('/explore') ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''}`} />
          <span className="text-xs font-black uppercase tracking-wider mt-1">Explore</span>
        </button>

        <LogRaceDialog
          trigger={
            <button className="flex flex-col items-center justify-center h-full touch-manipulation -mt-6">
              <div className="bg-racing-red hover:bg-red-600 rounded-full p-4 border-4 border-black shadow-xl shadow-red-500/50">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider mt-2 text-racing-red drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">Log</span>
            </button>
          }
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
        />

        <button
          onClick={() => navigate('/lists')}
          className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
            isActivePath('/lists') ? 'text-racing-red' : 'text-gray-400'
          }`}
        >
          <Activity className={`w-6 h-6 ${isActivePath('/lists') ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''}`} />
          <span className="text-xs font-black uppercase tracking-wider mt-1">Activity</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation transition-colors ${
            isActivePath('/profile') ? 'text-racing-red' : 'text-gray-400'
          }`}
        >
          {userPhotoURL ? (
            <img
              src={userPhotoURL}
              alt="Profile"
              className={`w-7 h-7 rounded-full object-cover ${isActivePath('/profile') ? 'ring-2 ring-racing-red' : ''}`}
            />
          ) : (
            <User className={`w-6 h-6 ${isActivePath('/profile') ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''}`} />
          )}
          <span className="text-xs font-black uppercase tracking-wider mt-1">Profile</span>
        </button>
      </div>
    </nav>
    </>
  );
};
