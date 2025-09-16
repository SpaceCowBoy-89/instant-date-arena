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
      <Card className="result-card">
        <CardContent className="p-2 sm:p-4">
          <p className="text-sm sm:text-base text-gray-600 text-center">
            No community match found. Try retaking the quiz!
          </p>
          <Button
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm sm:text-base py-2"
            onClick={() => navigate('/quiz')}
            aria-label="Retake quiz"
          >
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <img
          src={matchedCommunity.avatar || '/path/to/default-avatar.png'}
          alt={`${matchedCommunity.tag_name} avatar`}
          className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
        />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{matchedCommunity.tag_name}</h2>
      </div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-2xl sm:text-3xl font-bold text-green-600"
      >
        You're {Math.round((matchedCommunity.match_score || 0) * 100)}% a match!
      </motion.div>
      <Card className="result-card">
        <CardContent className="p-2 sm:p-4 space-y-2">
          <p className="text-sm sm:text-base text-gray-600">{matchedCommunity.tag_subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm sm:text-base text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {matchedCommunity.member_count?.toLocaleString() || '1.2K'} Members
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {matchedCommunity.post_count?.toLocaleString() || '500'} Posts
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Posts</h3>
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent className="-ml-2">
            {matchedCommunity.recent_posts?.map((post) => (
              <CarouselItem key={post.title} className="pl-2 basis-full sm:basis-1/2 md:basis-1/3">
                <Card className="h-full">
                  <CardContent className="p-2 sm:p-3">
                    <p className="font-medium text-sm sm:text-base">{post.title}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{post.author} • {post.timestamp}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            )) || (
              <CarouselItem className="pl-2 basis-full">
                <Card className="h-full">
                  <CardContent className="p-2 sm:p-3">
                    <p className="text-sm sm:text-base text-gray-600">No recent posts available.</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-full max-w-xs mx-auto"
      >
        <Button
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm sm:text-base py-2"
          onClick={() => navigate(`/communities/${matchedCommunity.id}`)}
          aria-label={`Join ${matchedCommunity.tag_name} community`}
        >
          <Sparkles className="mr-2 h-4 w-4" />Join Now
        </Button>
      </motion.div>
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 flex-wrap">
        <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base py-2" onClick={() => handleShare('whatsapp')} aria-label="Share on WhatsApp">
          <Share2 className="mr-2 h-4 w-4" />WhatsApp
        </Button>
        <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base py-2" onClick={() => handleShare('facebook')} aria-label="Share on Facebook">
          <Share2 className="mr-2 h-4 w-4" />Facebook
        </Button>
        <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base py-2" onClick={() => handleShare('instagram')} aria-label="Share on Instagram">
          <Share2 className="mr-2 h-4 w-4" />Instagram
        </Button>
        <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base py-2" onClick={() => handleShare('x')} aria-label="Share on X">
          <Share2 className="mr-2 h-4 w-4" />X
        </Button>
      </div>
    </>
  );
};

export default ResultCard;