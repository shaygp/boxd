import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Calendar, Flag, User } from 'lucide-react';
import { createOrUpdateSeasonRating, getUserSeasonRating, type SeasonRating } from '@/services/seasonRatings';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

interface RateSeasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  onRatingSubmitted?: () => void;
}

export const RateSeasonDialog = ({ open, onOpenChange, year, onRatingSubmitted }: RateSeasonDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [favoriteRace, setFavoriteRace] = useState('');
  const [favoriteDriver, setFavoriteDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRating, setExistingRating] = useState<SeasonRating | null>(null);

  // Load existing rating when dialog opens
  useEffect(() => {
    const loadExistingRating = async () => {
      if (open && auth.currentUser) {
        const existing = await getUserSeasonRating(auth.currentUser.uid, year);
        if (existing) {
          setExistingRating(existing);
          setRating(existing.rating);
          setReview(existing.review || '');
          setFavoriteRace(existing.favoriteRace || '');
          setFavoriteDriver(existing.favoriteDriver || '');
        } else {
          // Reset form for new rating
          setExistingRating(null);
          setRating(0);
          setReview('');
          setFavoriteRace('');
          setFavoriteDriver('');
        }
      }
    };

    loadExistingRating();
  }, [open, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser) {
      toast.error('Please sign in to rate seasons');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      await createOrUpdateSeasonRating(year, rating, review, favoriteRace, favoriteDriver);
      onRatingSubmitted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting season rating:', error);
      toast.error('Failed to submit rating. Please try again.', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setReview('');
    setFavoriteRace('');
    setFavoriteDriver('');
    setExistingRating(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg bg-[#0a0a0a] border-2 border-racing-red/40 max-h-[90vh] overflow-y-auto" aria-describedby="rate-season-description">
        <DialogHeader className="border-b-2 border-red-900/50 pb-4 sticky top-0 bg-[#0a0a0a] z-10">
          <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase tracking-wider text-white">
            <div className="w-1 h-6 bg-racing-red rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            {existingRating ? 'Edit' : 'Rate'} {year} Season
          </DialogTitle>
          <p id="rate-season-description" className="sr-only">
            Rate the {year} F1 season, add your review, and share your favorite race and driver
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-3 pb-6">
          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="font-black text-xs uppercase tracking-wider text-racing-red flex items-center gap-2">
              <Star className="w-3 h-3" />
              Season Rating
            </label>
            <div className="flex gap-1 items-center justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all transform hover:scale-110"
                >
                  <Star
                    className={`w-9 h-9 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-700 text-gray-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-center text-xs font-bold text-gray-400">
                {rating} / 5 stars
              </div>
            )}
          </div>

          {/* Review */}
          <div className="space-y-2">
            <label className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-3 h-3 text-racing-red" />
              Season Review (Optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={`What did you think of the ${year} season? Memorable moments, controversies, champions...`}
              className="min-h-[100px] bg-black/60 border-2 border-red-900/40 focus:border-racing-red text-white placeholder:text-gray-500 resize-none text-sm"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 text-right">{review.length}/1000</p>
          </div>

          {/* Favorite Race */}
          <div className="space-y-2">
            <label className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Flag className="w-3 h-3 text-racing-red" />
              Favorite Race (Optional)
            </label>
            <input
              type="text"
              value={favoriteRace}
              onChange={(e) => setFavoriteRace(e.target.value)}
              placeholder="e.g., Monaco Grand Prix, Brazilian GP..."
              className="w-full px-3 py-2 bg-black/60 border-2 border-red-900/40 focus:border-racing-red text-white placeholder:text-gray-500 rounded-lg outline-none transition-colors text-sm"
              maxLength={100}
            />
          </div>

          {/* Favorite Driver */}
          <div className="space-y-2">
            <label className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <User className="w-3 h-3 text-racing-red" />
              Favorite Driver (Optional)
            </label>
            <input
              type="text"
              value={favoriteDriver}
              onChange={(e) => setFavoriteDriver(e.target.value)}
              placeholder="e.g., Max Verstappen, Lewis Hamilton..."
              className="w-full px-3 py-2 bg-black/60 border-2 border-red-900/40 focus:border-racing-red text-white placeholder:text-gray-500 rounded-lg outline-none transition-colors text-sm"
              maxLength={100}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-red-900/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2 border-racing-red text-white hover:bg-racing-red/20 font-bold uppercase tracking-wider bg-transparent"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider"
              disabled={loading || rating === 0}
            >
              {loading ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
