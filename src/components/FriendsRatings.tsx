import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { getFollowing } from "@/services/follows";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FriendRating {
  userId: string;
  username: string;
  photoURL: string;
  rating: number;
}

interface FriendsRatingsProps {
  raceName: string;
  raceYear: number;
  allRaceLogs: any[];
}

export const FriendsRatings = ({ raceName, raceYear, allRaceLogs }: FriendsRatingsProps) => {
  const [friendsRatings, setFriendsRatings] = useState<FriendRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllDialog, setShowAllDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFriendsRatings = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Get user's following list
        const following = await getFollowing(currentUser.uid);

        // Filter race logs for friends who watched this race
        const friendsWhoWatched = allRaceLogs
          .filter(log =>
            log.raceName === raceName &&
            log.raceYear === raceYear &&
            log.rating &&
            log.rating > 0 &&
            following.some((friend: any) => friend.id === log.userId)
          )
          .map(log => {
            const friend = following.find((f: any) => f.id === log.userId);
            return {
              userId: log.userId,
              username: friend?.username || friend?.name || 'User',
              photoURL: friend?.photoURL || log.userAvatar || '',
              rating: log.rating
            };
          });

        // Remove duplicates (in case user logged the race multiple times)
        const uniqueFriends = friendsWhoWatched.reduce((acc: FriendRating[], current) => {
          const exists = acc.find(item => item.userId === current.userId);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        // Sort by rating (highest first)
        uniqueFriends.sort((a, b) => b.rating - a.rating);

        setFriendsRatings(uniqueFriends);
      } catch (error) {
        console.error('Error loading friends ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriendsRatings();
  }, [raceName, raceYear, allRaceLogs]);

  if (loading || friendsRatings.length === 0) {
    return null;
  }

  const displayLimit = 6;
  const hasMore = friendsRatings.length > displayLimit;

  const FriendAvatar = ({ friend, showTooltip = true }: { friend: FriendRating; showTooltip?: boolean }) => (
    <div
      onClick={() => navigate(`/user/${friend.userId}`)}
      className="group relative cursor-pointer"
    >
      {/* Avatar with rating badge */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-racing-red transition-colors">
          {friend.photoURL ? (
            <img
              src={friend.photoURL}
              alt={friend.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-xs font-black text-white uppercase">
                {friend.username.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Rating badge */}
        <div className="absolute -bottom-1 -right-1 bg-black border-2 border-yellow-500 rounded-full px-1 py-0.5 flex items-center justify-center gap-0.5 shadow-lg min-w-[24px]">
          <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
          <span className="text-[9px] font-black text-yellow-400 leading-none">{friend.rating}</span>
        </div>
      </div>

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="bg-black border-2 border-racing-red rounded px-2 py-1 whitespace-nowrap shadow-lg">
            <p className="text-xs font-bold text-white">{friend.username}</p>
            <div className="flex items-center gap-1 justify-center mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${
                    i < friend.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-racing-red mx-auto"></div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-center md:text-left">
          Friends' Ratings
        </h3>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {friendsRatings.slice(0, displayLimit).map((friend) => (
            <FriendAvatar key={friend.userId} friend={friend} />
          ))}

          {/* Show more button */}
          {hasMore && (
            <div
              onClick={() => setShowAllDialog(true)}
              className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 hover:border-racing-red transition-colors flex items-center justify-center cursor-pointer group"
            >
              <span className="text-sm font-black text-gray-400 group-hover:text-racing-red transition-colors">
                +{friendsRatings.length - displayLimit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* All Friends Dialog */}
      <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
        <DialogContent className="bg-black border-2 border-racing-red max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-black uppercase tracking-wider">
              Friends' Ratings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {friendsRatings.map((friend) => (
              <div
                key={friend.userId}
                onClick={() => {
                  setShowAllDialog(false);
                  navigate(`/user/${friend.userId}`);
                }}
                className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors group border border-gray-800 hover:border-racing-red"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-racing-red transition-colors flex-shrink-0">
                  {friend.photoURL ? (
                    <img
                      src={friend.photoURL}
                      alt={friend.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <span className="text-sm font-black text-white uppercase">
                        {friend.username.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Username and rating */}
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{friend.username}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < friend.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Rating number */}
                <div className="text-lg font-black text-yellow-400">
                  {friend.rating}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
