import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { submitAttempt, hasUserAttempted, getUserAttempts } from "@/services/grillTheGrid";
import { getValidSurnamesForLetter } from "@/utils/grillDrivers";
import { useAuth } from "@/contexts/AuthContext";

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const TIME_LIMIT = 180;

export const GrillTheGrid = () => {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeUsed, setTimeUsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<Set<string>>(new Set());
  const [hasPlayed, setHasPlayed] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [previousTime, setPreviousTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has already played and seed challenge
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Seed challenge on mount if it doesn't exist
        const { db } = await import('@/lib/firebase');
        const { collection, doc, setDoc, getDoc, Timestamp } = await import('firebase/firestore');

        const challengeRef = doc(collection(db, 'grillTheGridChallenges'), 'az-challenge');
        const challengeSnap = await getDoc(challengeRef);

        if (!challengeSnap.exists()) {
          console.log('Creating az-challenge...');
          await setDoc(challengeRef, {
            name: 'A-Z Challenge',
            type: 'az',
            description: 'Name an F1 driver surname for every letter of the alphabet',
            timeLimit: 180,
            questions: ALPHABET.map(letter => ({
              id: letter,
              prompt: `Name a driver whose surname starts with ${letter}`,
              correctAnswer: [],
            })),
            isActive: true,
            startDate: Timestamp.now(),
            totalAttempts: 0,
            createdAt: Timestamp.now(),
          });
          console.log('✅ Challenge created!');
        }

        // Check if user has already attempted
        const attempted = await hasUserAttempted(user.uid, 'az-challenge');
        setHasPlayed(attempted);

        if (attempted) {
          // Get their previous score
          const attempts = await getUserAttempts(user.uid, 'az-challenge');
          if (attempts.length > 0) {
            const lastAttempt = attempts[0];
            setPreviousScore(lastAttempt.score);
            setPreviousTime(lastAttempt.timeUsed);
          }
        }
      } catch (error) {
        console.error('Error initializing challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isComplete) {
      interval = setInterval(() => {
        setTimeUsed(prev => {
          if (prev >= TIME_LIMIT) {
            handleSubmit();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isComplete]);

  const handleStart = () => {
    setIsRunning(true);
    setTimeUsed(0);
    setAnswers({});
    setIsComplete(false);
    setScore(null);
    setCorrectAnswers(new Set());
  };

  const handleAnswerChange = (letter: string, value: string) => {
    setAnswers(prev => ({ ...prev, [letter]: value }));
  };

  const handleSubmit = async () => {
    setIsRunning(false);
    setIsComplete(true);

    let correctCount = 0;
    const correct = new Set<string>();

    // Import isValidDriverSurname for validation
    const { isValidDriverSurname } = await import('@/utils/grillDrivers');

    console.log('🏁 Validating answers...');
    ALPHABET.forEach(letter => {
      const userAnswer = (answers[letter] || '').trim();

      if (userAnswer && isValidDriverSurname(userAnswer, letter)) {
        correctCount++;
        correct.add(letter);
      }
    });

    console.log(`\n📊 Final score: ${correctCount}/26`);
    setScore(correctCount);
    setCorrectAnswers(correct);

    try {
      const answersArray = ALPHABET.map(letter => ({
        questionId: letter,
        userAnswer: answers[letter] || '',
      }));

      await submitAttempt('az-challenge', answersArray, timeUsed);

      toast({
        title: "Challenge Complete! 🏁",
        description: `${correctCount}/26 correct in ${formatTime(timeUsed)}`,
      });
    } catch (error) {
      console.error('Error submitting:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFilledCount = () => {
    return ALPHABET.filter(letter => answers[letter]?.trim()).length;
  };

  const generateShareImage = async () => {
    if (!score) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Background - Black with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.5, '#0a0a0a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Racing red border (thick frame)
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1188, 618);

    // Top racing stripe
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, 0, 1200, 6);
    ctx.fillRect(0, 624, 1200, 6);

    // Left vertical racing stripe
    ctx.fillRect(0, 0, 6, 630);
    ctx.fillRect(1194, 0, 6, 630);

    // Title section with red accent
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(60, 60, 8, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 68px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GRILL THE GRID', 90, 120);

    // Subtitle
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('A–Z Challenge', 90, 160);

    // Score section - centered
    ctx.textAlign = 'center';

    // "SCORE" label
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('SCORE', 600, 260);

    // Main score - huge and bold
    ctx.font = 'bold 160px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${score}/26`, 600, 400);

    // Time section
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('TIME', 600, 450);

    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillStyle = '#DC2626';
    ctx.fillText(formatTime(timeUsed), 600, 495);

    // Performance badge
    let badge = '';
    if (score === 26) badge = '🏆 PERFECT';
    else if (score >= 20) badge = '⭐ EXCELLENT';
    else if (score >= 15) badge = '✓ GREAT';
    else if (score >= 10) badge = '+ GOOD';

    if (badge) {
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(badge, 600, 535);
    }

    // Footer - boxboxd.fun
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(400, 570, 400, 4);

    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('boxboxd.fun', 600, 605);

    return canvas.toDataURL('image/png');
  };

  const handleShare = async () => {
    if (!score) return;

    // Generate the image
    const imageDataUrl = await generateShareImage();

    if (!imageDataUrl) {
      toast({ title: "Error", description: "Could not generate share image" });
      return;
    }

    // Convert data URL to blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const file = new File([blob], `grill-grid-${score}-${timeUsed}.png`, { type: 'image/png' });

    const text = `🏎️ I scored ${score}/26 on Grill the Grid (A-Z Challenge) in ${formatTime(timeUsed)}!\n\nCan you beat my score?\n\n#GrillTheGrid #F1 #BoxBoxD`;
    const url = window.location.href;

    // Try native share with image
    if (navigator.share) {
      try {
        // On mobile, try to share with the file
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Grill the Grid Score',
            text,
            files: [file]
          });
          toast({ title: "Shared!", description: "Score shared successfully" });
          return;
        }
      } catch (err) {
        console.log('Share with file failed, trying text only', err);
      }

      // Fallback to text + URL only
      try {
        await navigator.share({
          title: 'Grill the Grid Score',
          text: `${text}\n\n${url}`
        });
        toast({ title: "Shared!", description: "Link shared successfully" });

        // Also download the image
        const link = document.createElement('a');
        link.download = `grill-grid-score-${score}.png`;
        link.href = imageDataUrl;
        link.click();

        return;
      } catch (err) {
        console.log('Share failed', err);
      }
    }

    // Desktop fallback: Download image + copy text
    const link = document.createElement('a');
    link.download = `grill-grid-score-${score}.png`;
    link.href = imageDataUrl;
    link.click();

    const shareText = `${text}\n\n${url}`;
    await navigator.clipboard.writeText(shareText);

    toast({
      title: "Image Downloaded!",
      description: "Image saved & share text copied. Post them together on Twitter/X!"
    });
  };

  if (!isRunning && !isComplete) {
    if (loading) {
      return (
        <>
          <Header />
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
            <div className="text-white font-bold text-lg">Loading...</div>
          </div>
        </>
      );
    }

    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
          <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto mb-6">
              <div className="text-center mb-4 sm:mb-6">
                <div className="text-3xl sm:text-5xl md:text-6xl font-black mb-1 sm:mb-2 text-white uppercase tracking-tight">
                  GRILL THE GRID
                </div>
                <div className="h-0.5 sm:h-1 w-24 sm:w-32 bg-racing-red mx-auto mb-2"></div>
                <div className="text-base sm:text-xl md:text-2xl font-bold text-gray-300 uppercase tracking-wider">
                  A–Z Challenge
                </div>
              </div>

              {hasPlayed ? (
                /* Already Played Card */
                <Card className="bg-white/5 backdrop-blur-sm border-2 border-racing-red/40 p-6 sm:p-8 text-center">
                  <div className="text-5xl mb-4">🏁</div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 uppercase">
                    Already Completed
                  </h3>

                  {previousScore !== null && previousTime !== null && (
                    <div className="bg-black/40 backdrop-blur-sm border-2 border-white/20 rounded-lg p-4 mb-6">
                      <div className="text-xs sm:text-sm text-gray-400 uppercase font-bold mb-2">Your Score</div>
                      <div className="flex items-center justify-center gap-6">
                        <div>
                          <div className="text-3xl sm:text-4xl font-black text-white">
                            {previousScore}<span className="text-xl text-gray-500">/26</span>
                          </div>
                        </div>
                        <div className="w-px h-12 bg-white/20"></div>
                        <div>
                          <div className="text-3xl sm:text-4xl font-black text-racing-red">
                            {formatTime(previousTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => navigate('/grill-leaderboard')}
                    className="w-full bg-racing-red hover:bg-red-700 text-white font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 uppercase tracking-wider mb-6"
                  >
                    View Leaderboard
                  </Button>

                  <p className="text-sm sm:text-base text-gray-400">
                    You've already completed this challenge. Each driver can only compete once!
                  </p>
                </Card>
              ) : (
                /* Instructions Card */
                <Card className="bg-white/5 backdrop-blur-sm border-2 border-white/20 p-4 sm:p-6 mb-6">
                  <h3 className="text-lg sm:text-xl font-black text-white mb-3 uppercase">
                    The Challenge
                  </h3>
                  <p className="text-sm sm:text-base text-gray-200 mb-4">
                    Name an F1 driver's <span className="font-black text-white underline decoration-racing-red decoration-2 underline-offset-2">SURNAME</span> for every letter (A to Z).
                  </p>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-black text-racing-red mb-0.5">3:00</div>
                      <div className="text-xs sm:text-sm font-bold text-white">Time Limit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-black text-racing-red mb-0.5">ALL</div>
                      <div className="text-xs sm:text-sm font-bold text-white">F1 History</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-black text-racing-red mb-0.5">26</div>
                      <div className="text-xs sm:text-sm font-bold text-white">Letters</div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 mb-4">
                    <p className="text-xs sm:text-sm text-yellow-200">
                      <span className="font-bold">Tip:</span> Use SURNAME only (Senna, Prost, Hamilton, Verstappen)
                    </p>
                  </div>

                  <div className="bg-red-500/10 border-l-4 border-red-500 p-3 mb-4">
                    <p className="text-xs sm:text-sm text-red-200 font-bold">
                      ⚠️ You can only play this challenge ONCE!
                    </p>
                  </div>

                  <Button
                    onClick={handleStart}
                    className="w-full bg-racing-red hover:bg-red-700 text-white font-black text-base sm:text-lg py-4 sm:py-6 uppercase tracking-wider shadow-lg"
                  >
                    START CHALLENGE
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-6 sm:pb-12">
          {/* Challenge Header */}
          <div className="max-w-4xl mx-auto mb-3 sm:mb-4">
            <div className="text-center mb-3">
              <div className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                GRILL THE GRID
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase">A–Z Challenge</div>
            </div>

            {/* Timer & Progress */}
            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xs sm:text-xs text-gray-400 uppercase font-bold mb-0.5">Time</div>
                    <div className={`text-xl sm:text-3xl font-black tabular-nums ${timeUsed >= TIME_LIMIT - 30 ? 'text-racing-red animate-pulse' : 'text-white'}`}>
                      {formatTime(TIME_LIMIT - timeUsed)}
                    </div>
                  </div>
                  <div className="w-px h-10 sm:h-12 bg-white/20" />
                  <div className="text-center">
                    <div className="text-2xs sm:text-xs text-gray-400 uppercase font-bold mb-0.5">Done</div>
                    <div className="text-xl sm:text-3xl font-black text-white">
                      <span className={getFilledCount() === 26 ? 'text-green-400' : 'text-white'}>{getFilledCount()}</span>
                      <span className="text-gray-500 text-base sm:text-2xl">/26</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={getFilledCount() === 0 || isComplete}
                  className="bg-racing-red hover:bg-red-700 text-white font-black text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-4 uppercase disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  SUBMIT
                </Button>
              </div>
            </div>
          </div>

          {/* THE WHITEBOARD GRID */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow-2xl p-3 sm:p-6">
              {/* Grid Title */}
              <div className="text-center mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-gray-300">
                <div className="text-sm sm:text-base font-black text-gray-900 uppercase">
                  Enter driver SURNAME for each letter
                </div>
              </div>

              {/* The Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 sm:gap-2">
                {ALPHABET.map(letter => {
                  const validSurnames = getValidSurnamesForLetter(letter);
                  const hasValidAnswer = validSurnames.length > 0;

                  return (
                    <div key={letter} className="relative">
                      {/* Grid Cell */}
                      <div className={`
                        border-2 rounded overflow-hidden transition-all
                        ${!isComplete ? 'border-gray-400 bg-white hover:border-gray-600' : ''}
                        ${isComplete && correctAnswers.has(letter) ? 'border-green-600 bg-green-50' : ''}
                        ${isComplete && answers[letter] && !correctAnswers.has(letter) ? 'border-red-600 bg-red-50' : ''}
                        ${isComplete && !answers[letter] && hasValidAnswer ? 'border-gray-400 bg-gray-50' : ''}
                        ${!hasValidAnswer ? 'border-gray-300 bg-gray-100' : ''}
                      `}>
                        {/* Letter Label */}
                        <div className={`
                          text-center py-0.5 sm:py-1 text-2xs sm:text-xs font-black uppercase
                          ${!hasValidAnswer ? 'bg-gray-200 text-gray-500' : 'bg-gray-800 text-white'}
                        `}>
                          {letter}
                        </div>

                        {/* Input Field */}
                        <Input
                          value={answers[letter] || ''}
                          onChange={(e) => handleAnswerChange(letter, e.target.value)}
                          disabled={isComplete || !hasValidAnswer}
                          placeholder={!hasValidAnswer ? "—" : ""}
                          className={`
                            h-8 sm:h-10 text-center font-bold text-2xs sm:text-xs
                            border-0 border-t rounded-none p-1
                            ${!hasValidAnswer ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : ''}
                            ${hasValidAnswer && !isComplete ? 'bg-white border-gray-300 text-gray-900 focus:ring-1 focus:ring-blue-500' : ''}
                            ${isComplete && correctAnswers.has(letter) ? 'bg-green-50 border-green-600 text-green-900 font-black' : ''}
                            ${isComplete && answers[letter] && !correctAnswers.has(letter) ? 'bg-red-50 border-red-600 text-red-900' : ''}
                            ${isComplete && !answers[letter] && hasValidAnswer ? 'bg-gray-50 border-gray-400 text-gray-500' : ''}
                            disabled:cursor-not-allowed
                          `}
                        />

                        {/* Validation Mark */}
                        {isComplete && hasValidAnswer && (
                          <div className={`
                            absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black text-2xs sm:text-xs
                            ${correctAnswers.has(letter) ? 'bg-green-600 text-white' : ''}
                            ${answers[letter] && !correctAnswers.has(letter) ? 'bg-red-600 text-white' : ''}
                          `}>
                            {correctAnswers.has(letter) ? '✓' : answers[letter] ? '✗' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Help Text */}
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t-2 border-gray-300 text-center">
                <p className="text-2xs sm:text-xs text-gray-600">
                  <span className="font-bold">Tip:</span> All F1 drivers in history. Surname only (Senna, Prost, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Results Overlay */}
          {isComplete && score !== null && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="bg-white max-w-2xl w-full p-6 sm:p-12 text-center shadow-2xl">
                <div className="text-4xl sm:text-5xl font-black text-gray-900 uppercase mb-2">
                  Challenge Complete
                </div>
                <div className="h-1 w-32 bg-racing-red mx-auto mb-8"></div>

                <div className="flex justify-center gap-6 sm:gap-12 mb-8">
                  <div className="text-center">
                    <div className="text-gray-600 uppercase text-xs sm:text-sm font-bold mb-2 tracking-wider">Your Score</div>
                    <div className="text-5xl sm:text-7xl font-black text-gray-900">
                      {score}<span className="text-2xl sm:text-3xl text-gray-400">/26</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {score === 26 ? 'Perfect!' : score >= 20 ? 'Excellent!' : score >= 15 ? 'Great!' : score >= 10 ? 'Good!' : 'Keep trying!'}
                    </div>
                  </div>
                  <div className="w-px bg-gray-300" />
                  <div className="text-center">
                    <div className="text-gray-600 uppercase text-xs sm:text-sm font-bold mb-2 tracking-wider">Time Used</div>
                    <div className="text-5xl sm:text-7xl font-black text-gray-900">{formatTime(timeUsed)}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {timeUsed < 60 ? 'Lightning fast!' : timeUsed < 120 ? 'Quick!' : 'Good effort!'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleShare}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6"
                  >
                    Share Result
                  </Button>
                  <Button
                    onClick={handleStart}
                    className="bg-racing-red hover:bg-red-700 text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => navigate('/grill-leaderboard')}
                    variant="outline"
                    className="border-2 border-gray-900 text-gray-900 font-bold text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6 hover:bg-gray-900 hover:text-white"
                  >
                    View Leaderboard
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
