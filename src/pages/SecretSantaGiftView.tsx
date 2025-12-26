import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById, SecretSantaSubmission } from '@/services/secretSanta';
import { Helmet } from 'react-helmet-async';

export const SecretSantaGiftView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<SecretSantaSubmission | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/secret-santa');
      return;
    }
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    if (!id) return;

    try {
      const data = await getSubmissionById(id);

      if (!data) {
        navigate('/secret-santa');
        return;
      }

      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
      navigate('/secret-santa');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  if (!submission) return null;

  const pageTitle = `🎁 F1 Secret Santa 2026`;
  const pageDescription = `${submission.userName} just gifted ${submission.giftTitle} to ${submission.assignedDriver} on @Box_Boxd!`;
  const pageUrl = `https://boxboxd.fun/secret-santa/gift/${id}`;

  // Create OG image using Vercel OG Image API with custom template
  const ogImageParams = new URLSearchParams({
    title: `🎁 ${submission.giftTitle}`,
    subtitle: `For ${submission.assignedDriver}`,
    footer: `by ${submission.userName} • @Box_Boxd`
  });

  // Use the gift image as OG image for best Twitter preview
  const imageUrl = submission.giftImageUrl;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>

      <div className="min-h-screen bg-black">
        {/* Back Button */}
        <div className="border-b border-gray-800 pt-8">
          <div className="max-w-4xl mx-auto px-4 pb-4">
            <button
              onClick={() => navigate('/secret-santa')}
              className="text-gray-400 hover:text-white transition-colors font-bold tracking-wider min-h-[44px] flex items-center text-sm sm:text-base"
            >
              ← BACK TO SECRET SANTA
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-racing-red/20 to-black border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tighter">
              SECRET SANTA 2026
            </h1>
            <p className="text-gray-400">
              {submission.userName} gifted {submission.assignedDriver}
            </p>
          </div>
        </div>

      {/* Gift Card */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-racing-red rounded-2xl overflow-hidden">
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
              <p className="text-gray-500 text-sm mb-2">GIFT</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight">
                {submission.giftTitle.toUpperCase()}
              </h2>
              <p className="text-gray-500 text-sm mb-2">FOR</p>
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
      </div>
      </div>
    </>
  );
};
