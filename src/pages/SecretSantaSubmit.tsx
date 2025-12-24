import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getUserAssignedDriver,
  submitSecretSantaGift,
  hasUserSubmitted,
  Driver,
} from '@/services/secretSanta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export const SecretSantaSubmit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);

  const [giftTitle, setGiftTitle] = useState('');
  const [giftImageUrl, setGiftImageUrl] = useState('');
  const [productLink, setProductLink] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const driver = await getUserAssignedDriver();
      if (!driver) {
        navigate('/secret-santa');
        return;
      }
      setAssignedDriver(driver);

      const submitted = await hasUserSubmitted();
      if (submitted) {
        navigate('/secret-santa/gift-sent');
        return;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      navigate('/secret-santa');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', { name: file.name, type: file.type, size: file.size });

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please choose an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Check file type - more lenient for mobile browsers
    const isImage = file.type.startsWith('image/') ||
                    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name);

    if (!isImage) {
      toast({
        title: 'Invalid file type',
        description: 'Please choose an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to Firebase Storage
      const fileName = `secret-santa/${user?.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      console.log('Uploading to:', fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      console.log('Upload successful, URL:', url);

      setGiftImageUrl(url);
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error('Error details:', error.code, error.message);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assignedDriver) return;

    if (!giftTitle.trim()) {
      toast({
        title: 'Missing Gift Title',
        description: 'Please enter a title for your gift',
        variant: 'destructive',
      });
      return;
    }

    if (!giftImageUrl.trim()) {
      toast({
        title: 'Missing Image',
        description: 'Please add an image for your gift',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      await submitSecretSantaGift(assignedDriver, {
        giftTitle,
        giftImageUrl,
        productLink: productLink.trim() || undefined,
      });

      navigate('/secret-santa/gift-sent');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit gift',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!assignedDriver) return null;

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

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Driver Info */}
        <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-xl sm:rounded-2xl border-2 border-racing-red">
          <div className="absolute inset-0 bg-gradient-to-br from-racing-red/30 via-racing-red/10 to-black"></div>
          <div className="relative p-4 sm:p-6 md:p-8">
            <div className="text-xs font-black text-racing-red tracking-[0.2em] sm:tracking-[0.3em] mb-3">
              SENDING TO
            </div>
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <img
                src={assignedDriver.image}
                alt={assignedDriver.name}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Driver';
                }}
              />
              <div className="min-w-0">
                <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter leading-tight">
                  {assignedDriver.name.toUpperCase()}
                </h2>
                <p className="text-racing-red font-bold tracking-wider text-sm sm:text-base md:text-lg mt-1">
                  #{assignedDriver.number} • {assignedDriver.team.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">
              YOUR GIFT
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">
              What are you sending?
            </p>
          </div>

          {/* Gift Title */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="giftTitle" className="text-white font-black tracking-wider text-xs sm:text-sm">
              GIFT NAME
            </Label>
            <Input
              id="giftTitle"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
              placeholder="Lightning McQueen Plushie"
              className="bg-gray-900 border-2 border-gray-700 focus:border-racing-red text-white text-base sm:text-lg py-5 sm:py-6"
              maxLength={100}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-white font-black tracking-wider text-xs sm:text-sm">
              GIFT IMAGE
            </Label>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  id="giftImageUrl"
                  value={giftImageUrl}
                  onChange={(e) => setGiftImageUrl(e.target.value)}
                  placeholder="Or paste image URL"
                  className="bg-gray-900 border-2 border-gray-700 focus:border-racing-red text-white text-base sm:text-lg py-5 sm:py-6"
                />
              </div>

              <div className="relative">
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  disabled={uploading}
                  onClick={() => document.getElementById('imageUpload')?.click()}
                  className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-black py-5 sm:py-6 px-6 border-2 border-gray-700"
                >
                  {uploading ? 'UPLOADING...' : 'UPLOAD'}
                </Button>
              </div>
            </div>

            {giftImageUrl && (
              <div className="mt-3 sm:mt-4 relative rounded-lg sm:rounded-xl overflow-hidden border-2 border-gray-700">
                <img
                  src={giftImageUrl}
                  alt="Gift preview"
                  className="w-full h-48 sm:h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Invalid+Image';
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Upload an image or paste a URL
            </p>
          </div>

          {/* Product Link */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="productLink" className="text-white font-black tracking-wider text-xs sm:text-sm">
              PRODUCT LINK (OPTIONAL)
            </Label>
            <Input
              id="productLink"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              placeholder="https://amazon.com/..."
              className="bg-gray-900 border-2 border-gray-700 focus:border-racing-red text-white text-base sm:text-lg py-5 sm:py-6"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8">
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigate('/secret-santa');
              }}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-700 font-black py-5 sm:py-6 text-base sm:text-lg tracking-wider"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-racing-red hover:bg-racing-red/90 text-white font-black py-5 sm:py-6 text-base sm:text-lg tracking-wider relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative">
                {submitting ? 'SENDING...' : 'SEND GIFT'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
