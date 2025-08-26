import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface QuizHeaderProps {
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  navigate: (path: string) => void;
}

const QuizHeader = ({ currentQuestionIndex, questions, navigate }: QuizHeaderProps) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="quiz-header"
    >
      <div className="flex justify-between w-full max-width: 500px mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/communities')} className="text-sm sm:text-base">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex flex-col items-center">
          <div className="avatar h-10 w-10"></div> {/* Placeholder for consistency */}
          <h2>AI Quiz</h2>
        </div>
        <div className="progress">Question {currentQuestionIndex + 1}/{questions.length}</div>
      </div>
    </motion.div>
  );
};

export default QuizHeader;