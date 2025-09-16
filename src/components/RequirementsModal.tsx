import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Upload, User, MapPin, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RequirementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirements: {
    hasInterests: boolean;
    hasPhoto: boolean;
    hasAge: boolean;
    hasGender: boolean;
    hasLocation: boolean;
    hasBio: boolean;
  };
}

export function RequirementsModal({ open, onOpenChange, requirements }: RequirementsModalProps) {
  const navigate = useNavigate();

  const requirementsList = [
    {
      key: 'hasInterests',
      label: 'Add at least 3 interests',
      icon: <User className="w-4 h-4" />,
      met: requirements.hasInterests,
    },
    {
      key: 'hasPhoto',
      label: 'Upload a profile photo',
      icon: <Upload className="w-4 h-4" />,
      met: requirements.hasPhoto,
    },
    {
      key: 'hasAge',
      label: 'Add your age',
      icon: <User className="w-4 h-4" />,
      met: requirements.hasAge,
    },
    {
      key: 'hasGender',
      label: 'Add your gender',
      icon: <User className="w-4 h-4" />,
      met: requirements.hasGender,
    },
    {
      key: 'hasLocation',
      label: 'Add your location',
      icon: <MapPin className="w-4 h-4" />,
      met: requirements.hasLocation,
    },
    {
      key: 'hasBio',
      label: 'Write a bio (at least 25 characters)',
      icon: <FileText className="w-4 h-4" />,
      met: requirements.hasBio,
    },
  ];

  const handleCompleteProfile = () => {
    onOpenChange(false);
    navigate('/profile');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[90vw] max-w-md mx-auto rounded-[2rem] border-2 border-romance/20 shadow-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        hideCloseButton={true}
      >
        <div className="p-2">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-center text-lg font-bold text-foreground leading-snug mb-3">
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
              To take the compatibility test, please complete the following requirements:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-3">
            {requirementsList.map((requirement) => (
              <div
                key={requirement.key}
                className={`flex items-center space-x-3 p-2 rounded-xl border-2 transition-all duration-200 touch-manipulation ${
                  requirement.met
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                }}
              >
                <div className="flex-shrink-0">
                  {requirement.met ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="text-muted-foreground flex-shrink-0">
                    {requirement.icon}
                  </div>
                  <span className="text-sm font-medium leading-snug break-words">
                    {requirement.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleCompleteProfile}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] touch-manipulation active:scale-95"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              Complete Profile
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full h-12 rounded-xl font-medium text-base text-muted-foreground hover:text-foreground hover:bg-muted/20 min-h-[48px] touch-manipulation active:scale-95 transition-all duration-200"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}