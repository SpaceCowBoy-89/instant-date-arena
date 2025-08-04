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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-center">
            To take the compatibility test, please complete the following requirements:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          {requirementsList.map((requirement) => (
            <div
              key={requirement.key}
              className={`flex items-center space-x-3 p-3 rounded-lg border ${
                requirement.met
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex-shrink-0">
                {requirement.met ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex items-center space-x-2 flex-1">
                {requirement.icon}
                <span className="text-sm font-medium">{requirement.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleCompleteProfile} className="w-full">
            Complete Profile
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}