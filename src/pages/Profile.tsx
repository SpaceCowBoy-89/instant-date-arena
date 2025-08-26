import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Camera, User, ArrowLeft, Save, Loader2, Heart, Upload, X, ImageIcon, Moon } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { InterestsPicker } from '@/components/InterestsPicker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LocationDetector } from '@/components/LocationDetector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sofa, PartyPopper, Sparkles, Coffee, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const vibeOptions = [
  { name: 'Chillin', icon: Sofa, gradient: 'from-blue-400 to-indigo-500' },
  { name: 'We Outside', icon: PartyPopper, gradient: 'from-red-400 to-pink-500' },
  { name: 'Living Life', icon: Sparkles, gradient: 'from-purple-400 to-pink-500' },
  { name: 'Asleep', icon: Moon, gradient: 'from-gray-500 to-gray-700' },
  { name: 'Coffee Monster', icon: Coffee, gradient: 'from-orange-400 to-yellow-500' },
];

interface ActiveVibesCardProps {
  initialVibes: string[];
  onVibesChange?: (newVibes: string[]) => void;
}

const ActiveVibesCard: React.FC<ActiveVibesCardProps> = ({ initialVibes, onVibesChange }) => {
  const [vibes, setVibes] = useState(initialVibes);
  const [openPopover, setOpenPopover] = useState(false);
  const [newlyAdded, setNewlyAdded] = useState<string[]>([]);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeVibeCandidate, setRemoveVibeCandidate] = useState<string | null>(null);
  const displayedVibes = vibes.slice(0, 3);

  const handleAddVibe = (newVibe: string) => {
    if (!vibes.includes(newVibe)) {
      const updatedVibes = [...vibes, newVibe];
      setVibes(updatedVibes);
      setNewlyAdded(prev => [...prev, newVibe]);
      onVibesChange?.(updatedVibes);
      setTimeout(() => {
        setNewlyAdded(prev => prev.filter(v => v !== newVibe));
      }, 1000); // Remove animation after 1s
    }
  };

  const handleRemoveVibe = (vibeToRemove: string) => {
    const updatedVibes = vibes.filter((v) => v !== vibeToRemove);
    setVibes(updatedVibes);
    onVibesChange?.(updatedVibes);
  };

  const openRemoveModal = (vibe: string) => {
    setRemoveVibeCandidate(vibe);
    setShowRemoveDialog(true);
  };

  const confirmRemove = () => {
    if (removeVibeCandidate) {
      handleRemoveVibe(removeVibeCandidate);
    }
    setShowRemoveDialog(false);
    setRemoveVibeCandidate(null);
  };

  const getVibeData = (vibeName: string) => {
    return vibeOptions.find((opt) => opt.name === vibeName) || { icon: Sparkles, gradient: 'from-purple-400 to-pink-500' };
  };

  return (
    <>
      <div className="flex justify-center gap-6">
        {displayedVibes.map((vibe, index) => {
          const { icon: Icon, gradient } = getVibeData(vibe);
          return (
            <button
              key={vibe}
              onClick={() => openRemoveModal(vibe)}
              className={cn(
                'flex flex-col items-center transition-transform active:scale-110',
                index === displayedVibes.length - 1 && vibes.length > displayedVibes.length && 'relative',
                newlyAdded.includes(vibe) && 'animate-gentle-pulse'
              )}
            >
              <div
                className={cn(
                  `w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-r ${gradient} shadow-md`
                )}
              >
                <Icon className="h-8 w-8 text-white" />
              </div>
              <p className="mt-2 text-sm">{vibe}</p>
            </button>
          );
        })}
        {vibes.length < 3 && (
          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <button className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 shadow-md">
                  <Plus className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add Vibe</p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid grid-cols-3 gap-4">
                {vibeOptions.filter((opt) => !vibes.includes(opt.name)).map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => {
                      handleAddVibe(opt.name);
                      setOpenPopover(false);
                    }}
                    className="flex flex-col items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 animate-bubble-up"
                  >
                    <opt.icon className="h-6 w-6" />
                    <span className="text-xs mt-1">{opt.name}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Vibe</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to remove {removeVibeCandidate}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveVibeCandidate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const Profile = () => {
  const [ageRange, setAgeRange] = useState([22, 35]);
  const [maxDistance, setMaxDistance] = useState([24901]);
  const [genderPreference, setGenderPreference] = useState('Women');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState('Long-term relationship');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
        return;
      }

      if (profile) {
        setName(profile.name || '');
        setAge(profile.age?.toString() || '');
        setBio(profile.bio || '');
        setGender(profile.gender || '');
        setLocation(profile.location || '');
        setPhotos(Array.isArray(profile.photos) ? profile.photos.filter((url): url is string => typeof url === 'string') : (profile.photo_url ? [profile.photo_url] : []));
        
        const status = profile.verification_status as 'unverified' | 'pending' | 'verified' | 'rejected';
        setVerificationStatus(status || 'unverified');
        
        const prefs = (profile.preferences as any) || {};
        setInterests(Array.isArray(prefs.interests) ? prefs.interests : []);
        setVibes(Array.isArray(prefs.vibes) ? prefs.vibes : []);
        setLookingFor(typeof prefs.looking_for === 'string' ? prefs.looking_for : 'Long-term relationship');
        setAgeRange(Array.isArray(prefs.age_range) ? prefs.age_range : [22, 35]);
        setMaxDistance(Array.isArray(prefs.max_distance) ? prefs.max_distance : [24901]);
        setGenderPreference(typeof prefs.gender_preference === 'string' ? prefs.gender_preference : 'Women');
      } else {
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          setName(fullName);
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        img.onload = () => {
          try {
            const maxDimension = 800;
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                } else {
                  reject(new Error('Compression failed'));
                }
              },
              'image/jpeg',
              0.7
            );
          } catch (innerError) {
            reject(innerError);
          }
        };
        
        img.onerror = reject;
        
        img.src = URL.createObjectURL(file);
      } catch (outerError) {
        reject(outerError);
      }
    });
  };

  const uploadPhoto = async (file: File) => {
    try {
      setUploading(true);
      
      const compressedFile = await compressImage(file);
      
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `photos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const { choice } = await ActionSheet.showActions({
        title: 'Upload Photo',
        message: 'Select a source',
        options: [
          { title: 'Camera' },
          { title: 'Gallery' },
          { title: 'Cancel', style: ActionSheetButtonStyle.Cancel },
        ],
      });

      if (choice === 2) return;

      const source = choice === 0 ? CameraSource.Camera : CameraSource.Photos;

      const photo = await CapacitorCamera.getPhoto({
        resultType: CameraResultType.Uri,
        source,
        quality: 90,
      });

      if (!photo.path) return;

      const response = await fetch(photo.path);
      const blob = await response.blob();
      const file = new File([blob], `photo.${photo.format}`, { type: `image/${photo.format}` });

      const uploadedUrl = await uploadPhoto(file);
      if (uploadedUrl) {
        setPhotos(prev => [...prev, uploadedUrl]);
      }
    } catch (error) {
      console.error('Error in photo upload process:', error);
      toast({
        title: 'Error',
        description: 'Failed to select or upload photo',
        variant: 'destructive',
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!name.trim()) {
        setValidationMessage('Please enter your name');
        setShowValidationDialog(true);
        return;
      }

      if (!age || parseInt(age) < 18) {
        setValidationMessage('Please enter a valid age (18+)');
        setShowValidationDialog(true);
        return;
      }

      if (!gender) {
        setValidationMessage('Please select your gender');
        setShowValidationDialog(true);
        return;
      }

      if (!location.trim()) {
        setValidationMessage('Please enter your location');
        setShowValidationDialog(true);
        return;
      }

      if (photos.length === 0) {
        setValidationMessage('Please upload at least one photo');
        setShowValidationDialog(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const preferences = {
        interests,
        vibes,
        looking_for: lookingFor,
        age_range: ageRange,
        max_distance: maxDistance,
        gender_preference: genderPreference,
      };

      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name,
          age: parseInt(age),
          bio,
          gender,
          location,
          photos,
          preferences,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile saved successfully',
      });

      navigate('/lobby');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold ml-4">Edit Profile</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/badges')}>
            <img src="/assets/badges/badges.svg" alt="Badges" className="h-8 w-8" />
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Add up to 3 photos (optional). The first one will be your main profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main photo slot - larger and prominent */}
                <div className="relative w-full aspect-square max-w-md mx-auto border border-dashed rounded-lg shadow-md p-2">
                  {photos[0] ? (
                    <>
                      <img 
                        src={photos[0]} 
                        alt="Main profile photo" 
                        className="w-full h-full object-cover rounded-lg" 
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => removePhoto(0)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Main Photo
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePhotoUpload}
                    disabled={uploading || photos.length >= 3}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-2" />
                    )}
                    Add Photo
                  </Button>
                </div>
                {/* Horizontal carousel for additional photos */}
                {photos.length > 1 && (
                  <div className="flex overflow-x-auto gap-4 pb-4">
                    {photos.slice(1).map((photo, index) => (
                      <div key={index + 1} className="relative min-w-[150px] aspect-square">
                        <img 
                          src={photo} 
                          alt={`Profile photo ${index + 2}`} 
                          className="w-full h-full object-cover rounded-lg" 
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-8 w-8 rounded-full"
                          onClick={() => removePhoto(index + 1)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Active Vibes</CardTitle>
              <CardDescription>
                Select your current vibes (up to 3)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveVibesCard initialVibes={vibes} onVibesChange={setVibes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <LocationDetector
                  value={location}
                  onChange={setLocation}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bio</CardTitle>
              <CardDescription>
                Tell others a bit about yourself
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="Write your bio here..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interests & Hobbies</CardTitle>
              <CardDescription>
                Choose from our curated list of interests to help find compatible matches. Select up to 10 interests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterestsPicker
                selectedInterests={interests}
                onInterestsChange={setInterests}
                maxSelections={10}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-romance" />
                Dating Preferences
              </CardTitle>
              <CardDescription>
                Help us find your perfect matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Looking for</Label>
                <Select value={lookingFor} onValueChange={setLookingFor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Long-term relationship">Long-term relationship</SelectItem>
                    <SelectItem value="Casual dating">Casual dating</SelectItem>
                    <SelectItem value="Friendship">Friendship</SelectItem>
                    <SelectItem value="Not sure yet">Not sure yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Show me</Label>
                <Select value={genderPreference} onValueChange={setGenderPreference}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Age range: {ageRange[0]} - {ageRange[1]}</Label>
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={18}
                  max={65}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label>Maximum distance: {maxDistance[0] > 100 ? '∞ (Show everyone)' : `${maxDistance[0]} miles`}</Label>
                <Slider
                  value={maxDistance}
                  onValueChange={(value) => {
                    if (value[0] > 100) {
                      setMaxDistance([24901]);
                    } else {
                      setMaxDistance(value);
                    }
                  }}
                  min={0}
                  max={101}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 pb-24">
            <Button
              variant="outline"
              onClick={() => navigate('/lobby')}
              className="w-full order-2 sm:order-1"
              size="lg"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full order-1 sm:order-2"
              size="lg"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    
      <Navbar />

      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Your Profile</AlertDialogTitle>
            <AlertDialogDescription>
              {validationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;