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
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={() => setShowModal(false)}
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
        className="fixed left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl md:max-w-md md:mx-auto border-t border-gray-100"
        style={{
          bottom: '0px',
          maxHeight: '60vh',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Header with drag handle */}
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full mb-3"></div>
          <div className="flex items-center justify-between w-full px-4">
            <h3 className="text-lg font-semibold text-gray-800">Choose your answer</h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Answer options */}
        <div className="px-4 pb-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {questions[currentQuestionIndex]?.answers.map((answer, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group w-full bg-gradient-to-r from-gray-50 to-white rounded-2xl px-3 py-2 text-left border border-gray-200 shadow-sm transition-all duration-300 ${
                  isTyping
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-blue-300 hover:shadow-lg hover:from-blue-50 hover:to-white active:scale-[0.98] hover:-translate-y-0.5'
                }`}
                onClick={() => handleAnswerClick(answer.value)}
                disabled={isTyping}
                aria-label={`Select ${answer.value}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-base leading-relaxed">
                      {answer.value}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-all duration-300 ${
                    !isTyping ? 'group-hover:text-blue-500 group-hover:translate-x-1' : ''
                  }`} />
                </div>

                {/* Animated accent line */}
                <div className={`mt-2 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transform scale-x-0 origin-left transition-transform duration-300 ${
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