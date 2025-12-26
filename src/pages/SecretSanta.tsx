import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  assignDriverToUser,
  getUserAssignedDriver,
  hasUserSubmitted,
  Driver,
} from '@/services/secretSanta';
import { Button } from '@/components/ui/button';

export const SecretSanta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadAssignment();
  }, [user]);

  const loadAssignment = async () => {
    try {
      // Always call assignDriverToUser - it handles the logic of new vs existing
      const driver = await assignDriverToUser();
      setAssignedDriver(driver);
      setShowReveal(true);

      const submitted = await hasUserSubmitted();
      setAlreadySubmitted(submitted);
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAssignment = async () => {
    setRevealing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const driver = await assignDriverToUser();
      setAssignedDriver(driver);
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowReveal(true);
    } catch (error) {
      console.error('Error assigning driver:', error);
    } finally {
      setRevealing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="border-b border-gray-800 pt-8">
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors font-bold tracking-wider min-h-[44px] flex items-center text-sm sm:text-base"
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-800">
        {/* F1 Track Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(90deg, #fff 0px, #fff 40px, transparent 40px, transparent 80px)`,
          }}></div>
        </div>

        {/* Red Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-racing-red/20 via-racing-red/5 to-black"></div>

        <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12 md:py-16">
          <div className="text-center">
            <div className="mb-4 sm:mb-6">
              <div className="inline-block relative">
                <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-1 leading-none">
                  SECRET SANTA
                </h1>
                <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-12 sm:h-12 bg-racing-red rounded-full blur-xl"></div>
              </div>
              <div className="text-base xs:text-lg sm:text-xl md:text-2xl font-black text-racing-red tracking-wider">
                2026 GRID
              </div>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto font-light px-4">
              Get assigned a random F1 driver. Send them a gift. Share it with the world.
            </p>

            {!assignedDriver && (
              <div className="max-w-sm mx-auto px-4">
                <Button
                  onClick={handleGetAssignment}
                  disabled={revealing}
                  className="w-full bg-racing-red hover:bg-racing-red/90 text-white font-black py-4 sm:py-5 text-sm sm:text-base tracking-wider relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative">
                    {revealing ? 'ASSIGNING DRIVER...' : 'GET YOUR DRIVER'}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Racing Stripes */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-racing-red via-white to-racing-red"></div>
      </div>

      {/* Driver Reveal */}
      {assignedDriver && showReveal && (
        <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
          <div className="relative">
            {/* Red Glow Effect */}
            <div className="absolute inset-0 bg-racing-red/10 blur-2xl rounded-full"></div>

            <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-racing-red/50 rounded-xl overflow-hidden">
              {/* Header Badge */}
              <div className="bg-racing-red/10 border-b border-racing-red/30 px-4 py-3">
                <div className="text-xs font-black text-racing-red tracking-[0.2em] text-center">
                  YOUR ASSIGNMENT
                </div>
              </div>

              <div className="p-6">
                {/* Driver Image */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-t from-racing-red/20 to-transparent rounded-lg"></div>
                  <img
                    src={assignedDriver.image}
                    alt={assignedDriver.name}
                    className="w-full max-w-[240px] mx-auto h-auto object-contain relative z-10"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Driver';
                    }}
                  />
                </div>

                {/* Driver Info */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-1 leading-tight">
                    {assignedDriver.name.toUpperCase()}
                  </h2>
                  <div className="text-sm font-bold text-racing-red tracking-wide">
                    #{assignedDriver.number} • {assignedDriver.team.toUpperCase()}
                  </div>
                </div>

                {/* Action Buttons */}
                {alreadySubmitted ? (
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg px-4 py-3">
                      <p className="text-green-400 font-black text-sm tracking-wide text-center">
                        GIFT DELIVERED ✓
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => navigate('/secret-santa/my-gift')}
                        className="border border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-bold px-4 py-3 text-xs"
                      >
                        VIEW GIFT
                      </Button>
                      <Button
                        onClick={() => navigate('/secret-santa/gallery')}
                        className="bg-racing-red hover:bg-racing-red/90 text-white font-bold px-4 py-3 text-xs"
                      >
                        GALLERY
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => navigate('/secret-santa/submit')}
                    className="w-full bg-racing-red hover:bg-racing-red/90 text-white font-black py-4 text-sm tracking-wider relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative">CHOOSE YOUR GIFT</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
