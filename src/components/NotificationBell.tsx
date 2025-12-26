import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auth } from '@/lib/firebase';
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from '@/services/notifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(user.uid),
        getUnreadNotificationsCount(user.uid),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead && notification.id) {
      await markNotificationAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Update the notification in the list to show as read
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }

    if (notification.linkTo) {
      navigate(notification.linkTo);
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await markAllNotificationsAsRead(user.uid);
    setUnreadCount(0);
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'd';
      case 'comment':
        return '=�';
      case 'follow':
        return '=d';
      case 'mention':
        return '@';
      default:
        return '=';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/10"
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-racing-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-black border-2 border-racing-red/40" align="end">
        <div className="flex items-center justify-between p-4 border-b border-racing-red/20">
          <h3 className="font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-racing-red hover:text-red-400 hover:bg-white/10"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-racing-red/20">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.isRead
                      ? 'bg-racing-red/10 hover:bg-racing-red/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {notification.actorPhotoURL ? (
                        <img
                          src={notification.actorPhotoURL}
                          alt={notification.actorName}
                          className="w-10 h-10 rounded-full border border-racing-red/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-white font-bold">
                          {notification.actorName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1">
                          <p className="text-sm text-white">
                            <span className="font-bold">{notification.actorName}</span>{' '}
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-racing-red rounded-full absolute top-4 right-4" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
