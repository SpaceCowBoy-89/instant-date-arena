import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Users, MessageCircle, Share2, Sparkles } from "lucide-react";
import Confetti from "react-confetti";

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
  member_count?: number;
  post_count?: number;
  avatar?: string;
  recent_posts?: { title: string; author: string; timestamp: string }[];
  match_score?: number;
  matched_interests?: string[];
}

interface ResultCardProps {
  matchedCommunity: Community | null;
  showConfetti: boolean;
  handleShare: (platform: string) => void;
  navigate: (path: string) => void;
}

const ResultCard = ({ matchedCommunity, showConfetti, handleShare, navigate }: ResultCardProps) => {
  if (!matchedCommunity) {
    return (
      <Card className="result-card bg-gradient-to-br from-blue-50 to-purple-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🤔</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Hmm, let's try again!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We couldn't find your perfect match this time. Let's retake the quiz to find your ideal community!
          </p>
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl"
            onClick={() => navigate('/quiz')}
            aria-label="Retake quiz"
          >
            ✨ Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 pb-4">
      {showConfetti && <Confetti />}

      {/* Celebration Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 sm:space-y-4 pt-2 sm:pt-4"
      >
        <div className="text-5xl sm:text-6xl md:text-7xl animate-bounce">🎉</div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 px-2">
          Congratulations!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          We found your perfect community match!
        </p>
      </motion.div>

      {/* Community Match Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg sm:shadow-xl mx-2 sm:mx-0"
      >
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold shrink-0">
              {matchedCommunity.tag_name.charAt(0)}
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 text-center sm:text-left leading-tight">
              {matchedCommunity.tag_name}
            </h2>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
          >
            {Math.round((matchedCommunity.match_score || 0) * 100)}% Match!
          </motion.div>

          <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed px-2">
            {matchedCommunity.tag_subtitle}
          </p>
        </div>
      </motion.div>

      {/* Community Stats */}
      <Card className="bg-white/80 border border-gray-200 rounded-xl sm:rounded-2xl mx-2 sm:mx-0">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 shrink-0" />
              <span className="font-medium whitespace-nowrap">{matchedCommunity.member_count?.toLocaleString() || '1.2K'} Members</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 shrink-0" />
              <span className="font-medium whitespace-nowrap">{matchedCommunity.post_count?.toLocaleString() || '500'} Posts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts Preview */}
      {matchedCommunity.recent_posts && matchedCommunity.recent_posts.length > 0 && (
        <div className="space-y-2 sm:space-y-3 px-2 sm:px-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center px-2">What's happening in your community</h3>
          <div className="space-y-2">
            {matchedCommunity.recent_posts.slice(0, 3).map((post, index) => (
              <Card key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg sm:rounded-xl">
                <CardContent className="p-2.5 sm:p-3">
                  <p className="font-medium text-xs sm:text-sm text-gray-800 leading-snug">{post.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{post.author} • {post.timestamp}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-base sm:text-lg min-h-[48px] sm:min-h-[56px] active:scale-95"
            onClick={() => navigate(`/communities/${matchedCommunity.id}`)}
            aria-label={`Join ${matchedCommunity.tag_name} community`}
          >
            <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">Join {matchedCommunity.tag_name} Now!</span>
          </Button>
        </motion.div>

        {/* Share Options */}
        <div className="text-center space-y-2 sm:space-y-3">
          <p className="text-xs sm:text-sm text-gray-600">Share your match with friends!</p>
          <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              aria-label="Share on WhatsApp"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px]"
            >
              <Share2 className="mr-1 h-3 w-3 shrink-0" />
              <span className="hidden xs:inline">WhatsApp</span>
              <span className="xs:hidden">WA</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              aria-label="Share on Facebook"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px]"
            >
              <Share2 className="mr-1 h-3 w-3 shrink-0" />
              <span className="hidden xs:inline">Facebook</span>
              <span className="xs:hidden">FB</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('x')}
              aria-label="Share on X"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[40px]"
            >
              <Share2 className="mr-1 h-3 w-3 shrink-0" />
              <span>X</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;