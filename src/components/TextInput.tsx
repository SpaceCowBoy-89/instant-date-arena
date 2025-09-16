import { useState } from 'react';
import { moderateText } from '../services/moderation';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@radix-ui/react-alert-dialog';

function TextInput() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await moderateText(text);
      setIsLoading(false);

      if (result === 'safe') {
        toast.success('Text is safe and ready to save!');
        // Add logic to save to Supabase or proceed (e.g., client.from('profiles').insert({ bio: text }))
      } else if (result === 'unsafe') {
        setShowAlert(true);
        toast.error('Text flagged as inappropriate.');
      } else {
        toast.error('Error processing text. Please try again.');
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Moderation failed. Please try again.');
      console.error('Text moderation error:', error);
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your profile bio or message"
        className="w-full h-24"
        disabled={isLoading}
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !text.trim()}
        className="w-full"
      >
        {isLoading ? 'Checking...' : 'Submit'}
      </Button>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Inappropriate Content Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your text was flagged as inappropriate. Please revise and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button onClick={() => setShowAlert(false)}>OK</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TextInput;