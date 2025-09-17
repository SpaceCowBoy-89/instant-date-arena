import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface QuizQuestion {
  id: string;
  text: string;
  answers: { value: string; groups: { group_id: string; weight: number }[] }[];
}

interface QuizHeaderProps {
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  navigate: (path: string) => void;
  showModal?: boolean;
}

const QuizHeader = ({ currentQuestionIndex, questions, navigate, showModal }: QuizHeaderProps) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1
      }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-gray-200/50"
      style={{ backgroundColor: '#F1F1F2', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className={`flex items-center justify-between px-4 transition-all duration-300 ${showModal ? 'py-3' : 'py-3'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/communities')}
          className="p-1 transition-all duration-200"
        >
          <svg
            className="h-12 w-12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="chevron-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--romance))" />
                <stop offset="100%" stopColor="hsl(var(--purple-accent))" />
              </linearGradient>
            </defs>
            <path
              d="m15 18-6-6 6-6"
              stroke="url(#chevron-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </Button>

        <div className="flex flex-col items-center">
          <div className={`rounded-full overflow-hidden mb-1 transition-all duration-300 ${showModal ? 'w-14 h-14' : 'w-8 h-8'}`}
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2)) drop-shadow(0 0 0 2px rgba(255,255,255,0.8))',
              transform: 'translateZ(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.3)'
            }}>
            <img
              src="/src/assets/quiz-bot-avatar.svg"
              alt="AI Quiz Bot"
              className="w-full h-full object-cover"
            />
          </div>
          {!showModal && (
            <>
              <span className="text-sm font-semibold text-gray-900">AI Quiz</span>
              <span className="text-xs text-gray-500">online</span>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 min-w-0">
          {currentQuestionIndex + 1}/{questions.length}
        </div>
      </div>
    </motion.div>
  );
};

export default QuizHeader;