import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserSubmission, SecretSantaSubmission } from '@/services/secretSanta';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export const SecretSantaGiftSent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<SecretSantaSubmission | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadSubmission();
  }, [user]);

  const loadSubmission = async () => {
    try {
      const userSubmission = await getUserSubmission();

      if (!userSubmission) {
        navigate('/secret-santa');
        return;
      }

      setSubmission(userSubmission);

      // Trigger confetti animation
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 300);
    } catch (error) {
      console.error('Error loading submission:', error);
      navigate('/secret-santa');
    } finally {
      setLoading(false);
    }
  };

  // Use production URL for sharing
  const shareUrl = `https://boxboxd.fun/secret-santa/gift/${submission?.id}`;

  const shareText = `🎁 F1 Secret Santa 2026\n\nI just gifted ${submission?.giftTitle} to ${submission?.assignedDriver} on @Box_Boxd!\n\nCheck it out:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!submission) return null;

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/secret-santa')}
            className="text-gray-400 hover:text-white transition-colors font-bold tracking-wider"
          >
            ← BACK
          </button>
        </div>
      </div>

      {/* Success Message */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-block relative mb-6">
            <div className="w-24 h-24 bg-racing-red/20 rounded-full flex items-center justify-center border-4 border-racing-red mx-auto">
              <div className="text-5xl">🎁</div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
            GIFT DELIVERED
          </h1>

          <p className="text-xl text-gray-400 mb-2">
            Your gift has been sent to
          </p>
          <p className="text-3xl font-black text-racing-red tracking-tight">
            {submission.assignedDriver.toUpperCase()}
          </p>
        </div>

        {/* Gift Card Preview */}
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-racing-red rounded-2xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-racing-red px-6 py-4">
            <div className="text-center">
              <span className="font-black text-white text-lg tracking-wider">SECRET SANTA 2026</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Gift Image */}
            <div className="mb-6">
              <img
                src={submission.giftImageUrl}
                alt={submission.giftTitle}
                className="w-full h-64 sm:h-80 object-cover rounded-xl"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Gift';
                }}
              />
            </div>

            {/* Gift Info */}
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm mb-2">I GIFTED</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight">
                {submission.giftTitle.toUpperCase()}
              </h2>
              <p className="text-gray-500 text-sm mb-2">TO</p>
              <p className="text-xl sm:text-2xl font-bold text-racing-red tracking-wider">
                {submission.assignedDriver.toUpperCase()}
              </p>
            </div>

            {/* User Attribution */}
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-800">
              {submission.userAvatar && (
                <img
                  src={submission.userAvatar}
                  alt={submission.userName}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="text-left">
                <p className="text-white font-bold">{submission.userName}</p>
                <p className="text-xs text-gray-500">via @Box_Boxd</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3 max-w-md mx-auto">
          <Button
            onClick={handleShareTwitter}
            className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white font-black py-6 text-lg tracking-wider"
          >
            SHARE ON TWITTER
          </Button>

          <Button
            onClick={handleCopyLink}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black py-6 text-lg tracking-wider border-2 border-gray-700"
          >
            {copied ? 'LINK COPIED!' : 'COPY LINK'}
          </Button>

          <Button
            onClick={() => navigate('/secret-santa/gallery')}
            className="w-full bg-racing-red hover:bg-racing-red/90 text-white font-black py-6 text-lg tracking-wider"
          >
            SEE ALL GIFTS
          </Button>
        </div>
      </div>
    </div>
  );
};
