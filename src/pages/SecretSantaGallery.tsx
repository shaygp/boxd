import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getDriverSubmissions,
  toggleSubmissionLike,
  SecretSantaSubmission,
  DRIVERS_2026,
  Driver,
} from '@/services/secretSanta';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SecretSantaGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SecretSantaSubmission[]>([]);
  const [likingId, setLikingId] = useState<string | null>(null);

  const selectedDriverName = searchParams.get('driver');
  const selectedDriver = selectedDriverName
    ? DRIVERS_2026.find(d => d.name === selectedDriverName)
    : null;

  useEffect(() => {
    if (selectedDriverName) {
      loadDriverSubmissions(selectedDriverName);
    }
  }, [selectedDriverName]);

  const loadDriverSubmissions = async (driverName: string) => {
    setLoading(true);
    try {
      const data = await getDriverSubmissions(driverName);
      // Sort by most liked
      data.sort((a, b) => b.likes - a.likes);
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverClick = (driver: Driver) => {
    setSearchParams({ driver: driver.name });
  };

  const handleBack = () => {
    if (selectedDriver) {
      setSearchParams({});
    } else {
      navigate('/secret-santa');
    }
  };

  const handleLike = async (submission: SecretSantaSubmission, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like gifts',
        variant: 'destructive',
      });
      return;
    }

    if (!submission.id) return;

    setLikingId(submission.id);

    try {
      await toggleSubmissionLike(submission.id);

      // Update local state
      setSubmissions(prev => prev.map(s => {
        if (s.id === submission.id) {
          const isLiked = s.likedBy?.includes(user.uid);
          return {
            ...s,
            likes: isLiked ? s.likes - 1 : s.likes + 1,
            likedBy: isLiked
              ? s.likedBy.filter(id => id !== user.uid)
              : [...(s.likedBy || []), user.uid]
          };
        }
        return s;
      }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to like gift',
        variant: 'destructive',
      });
    } finally {
      setLikingId(null);
    }
  };

  const DriverCard = ({ driver }: { driver: Driver }) => {
    return (
      <div
        onClick={() => handleDriverClick(driver)}
        className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-gray-800 hover:border-racing-red transition-all bg-gradient-to-br from-gray-900 via-black to-gray-900"
      >
        {/* Driver Image */}
        <div className="relative aspect-square overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
          <img
            src={driver.image}
            alt={driver.name}
            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Driver';
            }}
          />

          {/* Driver Number Badge */}
          <div className="absolute top-3 right-3 w-14 h-14 rounded-full bg-racing-red border-2 border-white flex items-center justify-center z-20">
            <span className="text-white font-black text-xl">{driver.number}</span>
          </div>
        </div>

        {/* Driver Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <div className="text-xs font-black text-racing-red tracking-widest mb-1 uppercase">
            {driver.team}
          </div>
          <div className="text-lg font-black text-white tracking-tight uppercase leading-tight">
            {driver.name}
          </div>
        </div>
      </div>
    );
  };

  const GiftCard = ({ submission }: { submission: SecretSantaSubmission }) => {
    const isLiked = submission.likedBy?.includes(user?.uid || '');

    return (
      <div
        onClick={() => navigate(`/secret-santa/gift/${submission.id}`)}
        className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-gray-800 rounded-xl overflow-hidden hover:border-racing-red transition-all cursor-pointer group"
      >
        {/* Image */}
        <div className="relative aspect-square bg-black overflow-hidden">
          <img
            src={submission.giftImageUrl}
            alt={submission.giftTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Gift';
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-black text-white text-lg mb-3 line-clamp-2 tracking-tight uppercase">
            {submission.giftTitle}
          </h3>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div className="flex items-center gap-2">
              {submission.userAvatar && (
                <img
                  src={submission.userAvatar}
                  alt={submission.userName}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-xs text-gray-400 font-bold">{submission.userName}</span>
            </div>

            <button
              onClick={(e) => handleLike(submission, e)}
              disabled={likingId === submission.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                isLiked
                  ? 'bg-racing-red/20 text-racing-red'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-racing-red'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-racing-red' : ''}`} />
              <span className="text-sm font-black">{submission.likes}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-racing-red/20 to-black border-b border-gray-800 pt-4">
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 font-bold tracking-wider min-h-[44px] text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>BACK</span>
          </button>

          {selectedDriver ? (
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-racing-red overflow-hidden bg-black flex-shrink-0">
                <img
                  src={selectedDriver.image}
                  alt={selectedDriver.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <div className="text-xs font-black text-racing-red tracking-widest mb-2 uppercase">
                  {selectedDriver.team}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase mb-1">
                  {selectedDriver.name}
                </h1>
                <p className="text-gray-400 font-bold">
                  {submissions.length} {submissions.length === 1 ? 'gift' : 'gifts'} • Sorted by most liked
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
                SECRET SANTA GALLERY
              </h1>
              <p className="text-gray-400 text-lg font-bold">
                Choose a driver to see their gifts
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse"></div>
              <p className="text-gray-400 text-sm font-bold">Loading...</p>
            </div>
          </div>
        ) : selectedDriver ? (
          // Driver Gifts View
          submissions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 font-black text-lg mb-2">NO GIFTS YET</p>
              <p className="text-gray-600">Be the first to send a gift to {selectedDriver.name}!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {submissions.map(submission => (
                <GiftCard key={submission.id} submission={submission} />
              ))}
            </div>
          )
        ) : (
          // Drivers Grid View
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {DRIVERS_2026.map(driver => (
              <DriverCard key={driver.name} driver={driver} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
