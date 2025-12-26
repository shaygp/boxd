import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllUserSubmissions, SecretSantaSubmission, markSharedOnTwitter } from '@/services/secretSanta';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export const SecretSantaGiftSent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SecretSantaSubmission[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadSubmissions();
  }, [user]);

  const loadSubmissions = async () => {
    try {
      const userSubmissions = await getAllUserSubmissions();
      console.log('[SecretSantaGiftSent] Loaded submissions:', userSubmissions.length, userSubmissions);

      if (userSubmissions.length === 0) {
        navigate('/secret-santa');
        return;
      }

      setSubmissions(userSubmissions);

      // Trigger confetti animation
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 300);
    } catch (error) {
      console.error('Error loading submissions:', error);
      navigate('/secret-santa');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (submissionId: string) => {
    const shareUrl = `https://boxboxd.fun/secret-santa/gift/${submissionId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(submissionId);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShareTwitter = async (submission: SecretSantaSubmission) => {
    // Mark that user shared on Twitter (makes them eligible for tomorrow's driver)
    try {
      await markSharedOnTwitter();
    } catch (error) {
      console.error('Error marking Twitter share:', error);
    }

    // Open Twitter share dialog
    const shareUrl = `https://boxboxd.fun/secret-santa/gift/${submission.id}`;
    const shareText = `🎁 F1 Secret Santa 2026\n\nI just gifted ${submission.giftTitle} to ${submission.assignedDriver} on @Box_Boxd!\n\nCheck it out:`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    // Use location.href for better iOS compatibility
    window.location.href = twitterUrl;
  };

  if (loading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  if (submissions.length === 0) return null;

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <div className="border-b border-gray-800 pt-8">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <button
            onClick={() => navigate('/secret-santa')}
            className="text-gray-400 hover:text-white transition-colors font-bold tracking-wider min-h-[44px] flex items-center text-sm sm:text-base"
          >
            ← BACK
          </button>
        </div>
      </div>

      {/* Success Message */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-block relative mb-4">
            <div className="w-16 h-16 bg-racing-red/20 rounded-full flex items-center justify-center border-2 border-racing-red mx-auto">
              <div className="text-3xl">🎁</div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tighter">
            YOUR GIFTS
          </h1>

          <p className="text-sm text-gray-400">
            You've sent {submissions.length} gift{submissions.length !== 1 ? 's' : ''} this season
          </p>
        </div>

        {/* All Gifts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-racing-red/50 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="bg-racing-red/10 border-b border-racing-red/30 px-4 py-3">
                <div className="text-center">
                  <span className="font-black text-racing-red text-xs tracking-wider">SECRET SANTA 2026</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Gift Image */}
                <div className="mb-4">
                  <img
                    src={submission.giftImageUrl}
                    alt={submission.giftTitle}
                    className="w-full h-48 sm:h-56 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Gift';
                    }}
                  />
                </div>

                {/* Gift Info */}
                <div className="text-center mb-4">
                  <p className="text-gray-500 text-xs mb-1 font-semibold">I GIFTED</p>
                  <h2 className="text-lg sm:text-xl font-black text-white mb-3 tracking-tight leading-tight">
                    {submission.giftTitle.toUpperCase()}
                  </h2>
                  <p className="text-gray-500 text-xs mb-1 font-semibold">TO</p>
                  <p className="text-base sm:text-lg font-bold text-racing-red tracking-wide">
                    {submission.assignedDriver.toUpperCase()}
                  </p>
                </div>

                {/* User Attribution */}
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-800/50 mb-4">
                  {submission.userAvatar && (
                    <img
                      src={submission.userAvatar}
                      alt={submission.userName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{submission.userName}</p>
                    <p className="text-xs text-gray-500">via @Box_Boxd</p>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleShareTwitter(submission)}
                    className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white font-bold py-3 text-xs tracking-wide"
                  >
                    SHARE ON TWITTER TO GET A NEW DRIVER TOMORROW
                  </Button>

                  <Button
                    onClick={() => handleCopyLink(submission.id!)}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 text-xs tracking-wide border border-gray-700"
                  >
                    {copied === submission.id ? 'LINK COPIED!' : 'COPY LINK'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gallery Button */}
        <div className="mt-8 mb-8">
          <Button
            onClick={() => navigate('/secret-santa/gallery')}
            className="w-full max-w-lg mx-auto block bg-racing-red hover:bg-racing-red/90 text-white font-bold py-4 text-sm tracking-wide"
          >
            SEE GALLERY
          </Button>
        </div>
      </div>
    </div>
  );
};
