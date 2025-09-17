import { motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

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

  return (
    <>
      {/* Transparent backdrop - no greyout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-white/1"
        onClick={() => setShowModal(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh'
        }}
      />

      {/* Answer options modal */}
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
        className="fixed left-0 right-0 z-[110] bg-gradient-to-br from-white via-gray-50 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/30 rounded-t-3xl shadow-2xl md:max-w-md md:mx-auto border-t-2 border-romance/20 dark:border-romance/30"
        style={{
          bottom: '0px',
          maxHeight: '40vh',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Header with drag handle */}
        <div className="flex flex-col items-center pt-3 pb-2 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/10 to-pink-500/10 rounded-t-3xl"></div>
          </div>
          <div className="w-10 h-1 bg-romance/40 rounded-full mb-3 relative z-10"></div>
          <div className="flex items-center justify-between w-full px-4 relative z-10">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-romance to-purple-accent bg-clip-text text-transparent">Choose your answer</h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 text-muted-foreground hover:text-romance hover:bg-romance/10 rounded-full transition-all duration-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Answer options */}
        <div className="px-4 pb-6 max-h-64 overflow-y-auto">
          <div className="space-y-3">
            {questions[currentQuestionIndex]?.answers.map((answer, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative w-full bg-gradient-to-r from-white via-gray-50 to-purple-50/30 dark:from-gray-800 dark:via-gray-700 dark:to-purple-900/30 rounded-2xl px-4 py-4 text-left border-2 border-gray-200/50 dark:border-gray-700/30 shadow-lg transition-all duration-300 overflow-hidden ${
                  isTyping
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-romance/50 hover:shadow-xl hover:from-romance/5 hover:to-purple-accent/5 active:scale-[0.98] hover:-translate-y-1'
                }`}
                onClick={() => handleAnswerClick(answer.value)}
                disabled={isTyping}
                aria-label={`Select ${answer.value}`}
              >
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/10 to-pink-500/10 rounded-2xl"></div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1">
                    <p className="text-foreground font-medium text-base leading-relaxed">
                      {answer.value}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-all duration-300 ${
                    !isTyping ? 'group-hover:text-romance group-hover:translate-x-1' : ''
                  }`} />
                </div>

                {/* Animated accent line */}
                <div className={`mt-3 h-0.5 bg-gradient-to-r from-romance to-purple-accent rounded-full transform scale-x-0 origin-left transition-transform duration-300 ${
                  !isTyping ? 'group-hover:scale-x-100' : ''
                }`} />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AnswerOptions;