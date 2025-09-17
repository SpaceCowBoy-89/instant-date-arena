import { motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { useEffect } from "react";

interface QuizQuestion {
  id: string;
  text: string;
  answers: { value: string; groups: { group_id: string; weight: number }[] }[];
}

interface AnswerOptionsProps {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isTyping: boolean;
  handleAnswer: (answer: string) => void;
  setShowModal: (show: boolean) => void;
}

const AnswerOptions = ({ questions, currentQuestionIndex, isTyping, handleAnswer, setShowModal }: AnswerOptionsProps) => {
  const handleAnswerClick = (answer: string) => {
    if (!isTyping) {
      handleAnswer(answer);
      setShowModal(false);
    }
  };

  // Prevent background scroll when modal is open (important for native apps)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Handle escape key for accessibility
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [setShowModal]);

  return (
    <>
      {/* Transparent clickable area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100]"
        onClick={() => setShowModal(false)}
        style={{ touchAction: 'none' }} // Prevent pull-to-refresh and other gestures
      />

      {/* Answer options modal with backdrop behind it */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 40,
          opacity: { duration: 0.2 }
        }}
        className="fixed left-0 right-0 z-[110] rounded-t-3xl shadow-2xl md:max-w-md md:mx-auto border-t-2 border-romance/20 dark:border-romance/30"
        style={{
          bottom: '0px',
          maxHeight: '45vh', // Reduced height
          minHeight: '25vh', // Reduced minimum height
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', // Better safe area handling
          overscrollBehavior: 'contain' // Prevent scroll chaining on native apps
        }}
      >
        {/* Backdrop only behind the modal */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-t-3xl" />

        {/* Modal content with gradient overlay */}
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/30 rounded-t-3xl"
      >
        {/* Header with drag handle */}
        <div className="flex flex-col items-center pt-4 pb-3 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/10 to-pink-500/10 rounded-t-3xl"></div>
          </div>
          {/* Enhanced drag handle for native apps */}
          <div className="w-12 h-1.5 bg-romance/40 rounded-full mb-4 relative z-10 cursor-grab active:cursor-grabbing"></div>
          <div className="flex items-center justify-between w-full px-4 sm:px-6 relative z-10">
            <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-romance to-purple-accent bg-clip-text text-transparent">Choose your answer</h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 sm:p-2.5 text-muted-foreground hover:text-romance hover:bg-romance/10 rounded-full transition-all duration-200 touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Answer options */}
        <div className="px-4 sm:px-6 pb-3 max-h-[30vh] overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          <div className="space-y-3 sm:space-y-4">
            {questions[currentQuestionIndex]?.answers.map((answer, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative w-full bg-gradient-to-r from-white via-gray-50 to-purple-50/30 dark:from-gray-800 dark:via-gray-700 dark:to-purple-900/30 rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-4 sm:py-5 text-left border-2 border-romance/20 dark:border-romance/30 shadow-lg transition-all duration-300 overflow-hidden touch-manipulation ${
                  isTyping
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-romance/50 hover:shadow-xl hover:from-romance/5 hover:to-purple-accent/5 active:scale-[0.98] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-romance/50 focus:border-romance/50'
                }`}
                onClick={() => handleAnswerClick(answer.value)}
                disabled={isTyping}
                aria-label={`Select ${answer.value}`}
                style={{ minHeight: '56px' }} // Ensure minimum touch target size
              >
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/10 to-pink-500/10 rounded-2xl"></div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1 pr-3">
                    <p className="text-foreground font-medium text-base sm:text-lg leading-relaxed text-left">
                      {answer.value}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground transition-all duration-300 flex-shrink-0 ${
                    !isTyping ? 'group-hover:text-romance group-hover:translate-x-1' : ''
                  }`} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        </div>
      </motion.div>
    </>
  );
};

export default AnswerOptions;