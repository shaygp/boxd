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
      const existingDriver = await getUserAssignedDriver();
      if (existingDriver) {
        setAssignedDriver(existingDriver);
        setShowReveal(true);
      }
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
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="border-b border-gray-800 pt-4">
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
        <div className="absolute inset-0 bg-gradient-to-b from-racing-red/30 via-racing-red/10 to-black"></div>

        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20 md:py-32">
          <div className="text-center">
            <div className="mb-6 sm:mb-8">
              <div className="inline-block relative">
                <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-2 leading-none">
                  SECRET SANTA
                </h1>
                <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 h-12 sm:w-20 sm:h-20 bg-racing-red rounded-full blur-2xl"></div>
              </div>
              <div className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black text-racing-red tracking-wider">
                2026 GRID
              </div>
            </div>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto font-light px-4">
              Get assigned a random F1 driver. Send them a gift. Share it with the world.
            </p>

            {!assignedDriver && (
              <div className="max-w-md mx-auto px-4">
                <Button
                  onClick={handleGetAssignment}
                  disabled={revealing}
                  className="w-full bg-racing-red hover:bg-racing-red/90 text-white font-black py-6 sm:py-8 text-lg sm:text-xl tracking-wider relative overflow-hidden group"
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
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-racing-red via-white to-racing-red"></div>
      </div>

      {/* Driver Reveal */}
      {assignedDriver && showReveal && (
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 md:py-16">
          <div className="relative">
            {/* Red Glow Effect */}
            <div className="absolute inset-0 bg-racing-red/20 blur-3xl rounded-full"></div>

            <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-racing-red rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-16 overflow-hidden">
              {/* Checkered Flag Pattern */}
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 opacity-10">
                <div className="w-full h-full" style={{
                  backgroundImage: `repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)`,
                  backgroundSize: '20px 20px'
                }}></div>
              </div>

              <div className="text-center">
                <div className="text-xs sm:text-sm font-black text-racing-red tracking-[0.2em] sm:tracking-[0.3em] mb-4">
                  YOUR ASSIGNMENT
                </div>

                {/* Driver Card */}
                <div className="max-w-2xl mx-auto mb-8 sm:mb-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-racing-red/30 to-transparent rounded-xl"></div>
                    <img
                      src={assignedDriver.image}
                      alt={assignedDriver.name}
                      className="w-full max-w-xs sm:max-w-md mx-auto h-auto object-contain relative z-10"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Driver';
                      }}
                    />
                  </div>

                  <div className="mt-6 sm:mt-8">
                    <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-2 sm:mb-3 leading-none px-2">
                      {assignedDriver.name.toUpperCase()}
                    </div>
                    <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-racing-red tracking-wider">
                      #{assignedDriver.number} • {assignedDriver.team.toUpperCase()}
                    </div>
                  </div>
                </div>

                {alreadySubmitted ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-green-500/10 border-2 border-green-500/50 rounded-xl p-4 sm:p-6">
                      <p className="text-green-400 font-black text-base sm:text-lg tracking-wide">
                        GIFT DELIVERED
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <Button
                        onClick={() => navigate('/secret-santa/my-gift')}
                        className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-black font-black px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base"
                      >
                        VIEW MY GIFT
                      </Button>
                      <Button
                        onClick={() => navigate('/secret-santa/gallery')}
                        className="bg-racing-red hover:bg-racing-red/90 text-white font-black px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base"
                      >
                        SEE ALL GIFTS
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => navigate('/secret-santa/submit')}
                    className="w-full sm:w-auto bg-racing-red hover:bg-racing-red/90 text-white font-black py-6 sm:py-8 px-8 sm:px-12 text-lg sm:text-xl tracking-wider relative overflow-hidden group"
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
