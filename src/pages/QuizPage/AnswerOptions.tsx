import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface AnswerOptionsProps {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isTyping: boolean;
  handleAnswer: (answer: string) => void;
  setShowModal: (show: boolean) => void;
}

const AnswerOptions = ({ questions, currentQuestionIndex, isTyping, handleAnswer, setShowModal }: AnswerOptionsProps) => {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="answer-modal"
      onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
    >
      <div className="answer-content">
        <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
        <div className="answer-options">
          {questions[currentQuestionIndex]?.options.slice(0, 5).map((option, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Button
                variant="outline"
                className="answer-btn"
                onClick={() => handleAnswer(option.short)}
                disabled={isTyping}
              >
                {option.short} {option.short.includes('🍷') || option.short.includes('🎬') || option.short.includes('🏞️') ? '' : '🍀'}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-2 text-gray-400">?</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{option.full}</p>
                  </TooltipContent>
                </Tooltip>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AnswerOptions;