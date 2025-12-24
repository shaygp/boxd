import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById, SecretSantaSubmission } from '@/services/secretSanta';

export const SecretSantaOGImage = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<SecretSantaSubmission | null>(null);

  useEffect(() => {
    if (!id) return;
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    if (!id) return;

    try {
      const data = await getSubmissionById(id);
      if (data) {
        setSubmission(data);
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    }
  };

  if (!submission) {
    return (
      <div className="w-[1200px] h-[630px] bg-black flex items-center justify-center">
        <div className="w-4 h-4 bg-racing-red rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-[1200px] h-[630px] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-12">
      {/* Card Container */}
      <div className="w-full h-full bg-black border-4 border-racing-red rounded-3xl overflow-hidden flex">
        {/* Left Side - Gift Image */}
        <div className="w-1/2 h-full relative overflow-hidden">
          <img
            src={submission.giftImageUrl}
            alt={submission.giftTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/600x630/1a1a1a/dc2626?text=Gift';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50"></div>
        </div>

        {/* Right Side - Text Content */}
        <div className="w-1/2 h-full flex flex-col justify-center px-12 relative">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-racing-red/20 rounded-full blur-3xl"></div>

          {/* Header Badge */}
          <div className="mb-6">
            <div className="inline-block px-6 py-2 bg-racing-red rounded-full">
              <span className="font-black text-white text-lg tracking-wider">SECRET SANTA 2026</span>
            </div>
          </div>

          {/* Gift Title */}
          <h1 className="text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            {submission.giftTitle.toUpperCase()}
          </h1>

          {/* Driver Info */}
          <div className="mb-8">
            <p className="text-gray-500 text-xl mb-2 font-bold">FOR</p>
            <p className="text-4xl font-black text-racing-red tracking-wide">
              {submission.assignedDriver.toUpperCase()}
            </p>
          </div>

          {/* User Attribution */}
          <div className="flex items-center gap-4 pt-6 border-t-2 border-gray-800">
            {submission.userAvatar && (
              <img
                src={submission.userAvatar}
                alt={submission.userName}
                className="w-16 h-16 rounded-full border-2 border-racing-red"
              />
            )}
            <div>
              <p className="text-white font-black text-xl">{submission.userName}</p>
              <p className="text-gray-500 font-bold">via @Box_Boxd</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
