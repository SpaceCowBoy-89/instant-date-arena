import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

const PREDEFINED_INTERESTS = [
  "3D printing", "Acroyoga", "Acting", "Action Figures", "Aerospace", "Air Hockey", 
  "Aircraft Spotting", "Airsoft", "Animation", "Ant-keeping", "Antiquing & Artefacts", 
  "Aquascaping", "Archaeology", "Archery", "Art & Art Collecting", "Astrology", 
  "Astronomy", "Audiophile", "Auto Detailing", "Auto Racing", "Auto Restoration", 
  "Axe Throwing", "BASE jumping", "BMX", "Backgammon", "Backpacking", "Badminton", 
  "Baking", "Ballet Dancing", "Ballroom Dancing", "Baseball", "Basketball", 
  "Baton Twirling", "Beach Volleyball", "Beachcombing", "Beatboxing", "Beauty Pageants", 
  "Beekeeping", "Beer Tasting", "Bell Ringing", "Benchmarking (PC)", "Billiards", 
  "Biology", "Birdwatching", "Blacksmithing", "Blogging", "Board Sports", "Board Games", 
  "Bodybuilding", "Bonsai", "Book Folding", "Book Collecting", "Book Restoration", 
  "Botany", "Bowling", "Boxing", "Brazilian Jiu-Jitsu", "Breadmaking", "Breakdancing", 
  "Bridge", "Bullet Journaling", "Butterfly Watching", "Button Collecting", "Calisthenics", 
  "Calligraphy", "Camping", "Candle Making", "Candy making", "Canoeing", "Canyoneering", 
  "Car Spotting", "Car Tuning", "Card Games", "Cartophily", "Caving", "Ceramics", 
  "Checkers", "Cheerleading", "Cheesemaking", "Chemistry", "Chess", "Climbing", 
  "Clothesmaking", "Coding", "Coffee Roasting", "Coin Collecting", "Color Guard", 
  "Coloring", "Comic Book Collecting", "Competitive Eating", "Composting", "Confectionery", 
  "Conlanging", "Construction", "Cooking", "Cornhole", "Cosplaying", "Couponing", 
  "Craft", "Creative Writing", "Cribbage", "Cricket", "Crocheting", "Croquet", 
  "Cross-stitch", "Crossword Puzzles", "Cryptography", "Crystals", "Curling", "Cycling", 
  "DJing", "Dancing", "Dandyism", "Darts", "Debate", "Decorating", "Deltiology", 
  "Diamond Painting", "Diorama", "Disc golf", "Distro Hopping", "Diving", "Djembe", 
  "Dog Training", "Dominoes", "Dowsing", "Electronics", "Element Collecting", "Embroidery", 
  "Engineering", "Engraving", "Ephemera collecting", "Equestrianism", "Esports", 
  "Exhibition Drill", "Fantasy Sports", "Farming", "Fencing", "Feng Shui Decorating", 
  "Field Hockey", "Figure Skating", "Filmmaking", "Fish Farming", "Fishing", "Fishkeeping", 
  "Fitness", "Flag Football", "Flower Arranging & Collecting", "Flower growing", 
  "Fly tying", "Flying disc", "Flying model planes", "Footbag", "Foosball", "Foraging", 
  "Fossicking", "Fossil hunting", "Freestyle football", "Frisbee", "Fruit picking", 
  "Furniture building", "Gaming", "Gardening", "Genealogy", "Geocaching", "Geology", 
  "Ghost hunting", "Gingerbread house making", "Glassblowing", "Go", "Gold prospecting", 
  "Golfing", "Gongfu tea", "Gongoozling", "Graffiti", "Groundhopping", "Gunsmithing", 
  "Gymnastics", "Hacking", "Ham Radio", "Handball", "Herbalism", "Herping", "Hiking", 
  "Horse Racing", "Tunneling", "Home Improvement", "Homebrewing", "Horseback Riding", 
  "Horseshoes", "Hula Hooping", "Hunting", "Hurling", "Hydro Dipping", "Hydroponics", 
  "Ice Hockey", "Iceboating", "Inline Skating", "Insect collecting", "Instruments", 
  "Inventing", "Jewelry making", "Jigsaw puzzles", "Jogging", "Journaling", "Judo", 
  "Juggling", "Jujitsu", "Jukskei", "Jumping rope", "Kabaddi", "Karaoke", "Kart racing", 
  "Kayaking", "Kendama", "Kendo", "Kite flying", "Kitesurfing", "Knife collecting", 
  "Knife making", "Knife throwing", "Knitting", "Knot tying", "Kombucha brewing", 
  "LARPing", "Lace making", "Lacrosse", "Lapidary", "Laser Tag", "Leather Crafting", 
  "Lego Building", "Letterboxing", "Linguistics", "Lock picking", "Lomography", 
  "Longboarding", "Machining", "Macrame", "Magic", "Magnet Fishing", "Mahjong", 
  "Makeup", "Manga", "Marbles", "Marching band", "Martial Arts", "Massaging", 
  "Mathematics", "Mazes", "Mechanics", "Medical science", "Meditation", "Memory training", 
  "Metal detecting", "Metalworking", "Meteorology", "Microbiology", "Microscopy", 
  "Mineral collecting", "Mini Golf", "Miniature art", "Minimalism", "Model United Nations", 
  "Model Building", "Modeling", "Motorsports", "Motorcycling", "Mountain biking", 
  "Mountaineering", "Movie memorabilia collecting", "Museum visiting", "Music", 
  "Mycology", "Nail art", "Needlepoint", "Netball", "Neuroscience", "Noodling", 
  "Nordic skating", "Orienteering", "Origami", "Outdoors", "Paintball", "Painting", 
  "Paragliding", "Parkour", "Pen Spinning", "People-watching", "Performance", "Perfume", 
  "Pet sitting", "Philately", "Phillumeny", "Philosophy", "Photography", "Physics", 
  "Pickleball", "Picnicking", "Pilates", "Pin", "Plastic art", "Playing musical instruments", 
  "Podcasting", "Poetry", "Poi", "Poker", "Pole dancing", "Polo", "Pools", "Postcrossing", 
  "Pottery", "Powerboat racing", "Powerlifting", "Practical Jokes", "Pressed flower craft", 
  "Proofreading and editing", "Proverbs", "Psychology", "Public speaking", "Puppetry", 
  "Puzzles", "Pyrography", "Qigong", "Quidditch", "Quilling", "Quilting", "Quizzes", 
  "Race Car Driving", "Race walking", "Racquetball", "Radio-controlled models", "Rafting", 
  "Rappelling", "Rapping", "Reading", "Recipe creation", "Record collecting", "Refinishing", 
  "Reiki", "Renaissance fair", "Renovating", "Research", "Reviewing Gadgets", 
  "Robotics & Robot Competitions", "Rock balancing", "Rock climbing", "Rock painting", 
  "Rock Collecting", "Role-playing games", "Roller derby", "Roller skating", "Rubik's Cube", 
  "Rugby", "Rughooking", "Running", "Safari", "Sailing", "Sand art", "Scouting", 
  "Scrapbooking", "Scuba Diving", "Sculling or rowing", "Sculpting", "Scutelliphily", 
  "Sea glass collecting", "Seashell collecting", "Sewing", "Shoemaking", "Shogi", 
  "Shooting", "Shortwave listening", "Shuffleboard", "Singing", "Skateboarding", 
  "Sketching", "Skiing", "Skimboarding", "Skipping rope", "Skydiving", "Slacklining", 
  "Sled dog racing", "Sledding", "Slot cars", "Snorkeling", "Snowboarding", "Snowmobiling", 
  "Snowshoeing", "Soapmaking", "Soccer", "Softball", "Spearfishing", "Speed skating", 
  "Sport stacking", "Sports memorabilia", "Spreadsheets", "Squash", "Stamp collecting", 
  "Stand-up comedy", "Stone skipping", "Storm chasing", "Story writing", "Storytelling", 
  "Stretching", "Sudoku", "Sun bathing", "Surfing", "Survivalism", "Swimming", 
  "Table tennis", "Taekwondo", "Tai chi", "Taoism", "Tapestry", "Tarot", "Tattooing", 
  "Taxidermy", "Tea bag collecting", "Teaching", "Tennis", "Terrariums", "Tether car", 
  "Thrifting", "Thru-hiking", "Ticket collecting", "Topiary", "Tour skating", "Tourism", 
  "Trade Fair", "Trainspotting", "Trapshooting", "Travel", "Treasure Hunting", "Triathlon", 
  "Ultimate frisbee", "Unicycling", "Upcycling", "Urban exploration", "VR Gaming", 
  "Vegetable farming", "Vehicle restoration", "Video editing", "Video game collecting", 
  "Video game developing", "Videography", "Vintage cars", "Vintage clothing", "Vinyl Records", 
  "Voice Acting", "Volleyball", "Volunteering", "Walking", "Wargaming", "Watch making", 
  "Water polo", "Water sports", "Wax sealing", "Waxing", "Weaving", "Weightlifting", 
  "Welding", "Whittling", "Wine Tasting And Making", "Witchcraft", "Wood carving", 
  "Woodworking", "Wrestling", "Writing", "Yo-yoing", "Yoga", "Zoo visiting", "Zumba"
];

interface InterestsPickerProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  maxSelections?: number;
}

export const InterestsPicker = ({ 
  selectedInterests, 
  onInterestsChange, 
  maxSelections = 10 
}: InterestsPickerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredInterests = PREDEFINED_INTERESTS.filter(interest =>
    interest.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedInterests = showAll ? filteredInterests : filteredInterests.slice(0, 50);

  const toggleInterest = (interest: string) => {
    const isSelected = selectedInterests.includes(interest);
    if (isSelected) {
      onInterestsChange(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < maxSelections) {
      onInterestsChange([...selectedInterests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    onInterestsChange(selectedInterests.filter(i => i !== interest));
  };

  return (
    <div className="space-y-4">
      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Selected ({selectedInterests.length}/{maxSelections})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <Badge
                key={interest}
                variant="default"
                className="cursor-pointer bg-romance text-white hover:bg-romance/80"
                onClick={() => removeInterest(interest)}
              >
                {interest}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search interests..."
          className="pl-10"
        />
      </div>

      {/* Available Interests */}
      <div className="space-y-2">
        <div className="text-sm font-medium">
          Available Interests ({filteredInterests.length})
        </div>
        <div className="max-h-64 overflow-y-auto border rounded-md p-3">
          <div className="flex flex-wrap gap-2">
            {displayedInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              const canSelect = !isSelected && selectedInterests.length < maxSelections;
              
              return (
                <Badge
                  key={interest}
                  variant={isSelected ? "default" : "secondary"}
                  className={`cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-romance text-white" 
                      : canSelect 
                        ? "hover:bg-romance/20 hover:border-romance" 
                        : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => canSelect || isSelected ? toggleInterest(interest) : undefined}
                >
                  {interest}
                </Badge>
              );
            })}
          </div>
          
          {!showAll && filteredInterests.length > 50 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="mt-3"
            >
              Show all {filteredInterests.length} interests
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};