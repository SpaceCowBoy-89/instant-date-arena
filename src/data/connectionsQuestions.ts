export interface Answer {
  text: string;
  tags: string[];
  interests?: string[];
  groups?: string[];
}

export interface Question {
  question: string;
  answers: Answer[];
}

export const connectionsQuestions: Question[] = [
  {
    "question": "What fictional world would you take a date to?",
    "answers": [
      { "text": "Hogwarts — casting flirty spells in the Forbidden Forest.", "tags": ["nerdy", "flirty"], "interests": ["Reading", "Storytelling"], "groups": ["Book Lovers"] },
      { "text": "Middle-earth — hiking the Shire with second breakfasts.", "tags": ["wholesome", "nerdy"], "interests": ["Hiking", "Cooking"], "groups": ["Adventurers", "Foodies"] },
      { "text": "Cyberpunk city — hacking the skyline for a neon date.", "tags": ["nerdy", "flirty"], "interests": ["Hacking", "Coding"], "groups": ["Tech Hobbyists"] },
      { "text": "Anime world — cosplaying as sidekicks in a Ghibli forest.", "tags": ["wholesome", "nerdy"], "interests": ["Cosplaying", "Animation"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "How do you respond to 'wyd?' texts?",
    "answers": [
      { "text": "Crafting a flirty haiku in my Notes app.", "tags": ["flirty", "quirky"], "interests": ["Poetry", "Writing"], "groups": ["Book Lovers"] },
      { "text": "Brewing kombucha and overanalyzing your last message.", "tags": ["funny", "nerdy"], "interests": ["Kombucha brewing"], "groups": ["Foodies"] },
      { "text": "Building a robot that sends better replies than me.", "tags": ["nerdy", "playful"], "interests": ["Robotics & Robot Competitions"], "groups": ["Tech Hobbyists"] },
      { "text": "Sketching your vibe in my bullet journal.", "tags": ["flirty", "sweet"], "interests": ["Bullet Journaling", "Sketching"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "What's your idea of romantic revenge?",
    "answers": [
      { "text": "Posting my bonsai thriving better than their vibes.", "tags": ["sassy", "wholesome"], "interests": ["Bonsai"], "groups": ["Nature Lovers"] },
      { "text": "Winning at disc golf and dedicating it to my ex.", "tags": ["sassy", "playful"], "interests": ["Disc golf"], "groups": ["Sports Enthusiasts"] },
      { "text": "Sending a playlist of breakup songs I composed.", "tags": ["flirty", "nerdy"], "interests": ["Music"], "groups": ["Music & Performance"] },
      { "text": "Collecting rare coins and flexing my better investments.", "tags": ["petty-cute", "funny"], "interests": ["Coin Collecting"], "groups": ["Collectors"] }
    ]
  },
  {
    "question": "Which nerdy debate could you argue for hours?",
    "answers": [
      { "text": "Marvel vs. DC — my comic collection backs my argument.", "tags": ["nerdy", "sassy"], "interests": ["Comic Book Collecting"], "groups": ["Anime Addicts"] },
      { "text": "Best board game strategy — I've got spreadsheets.", "tags": ["nerdy", "funny"], "interests": ["Board Games"], "groups": ["Gamers"] },
      { "text": "Is time travel ethical? I'll cite sci-fi novels.", "tags": ["nerdy", "playful"], "interests": ["Reading"], "groups": ["Book Lovers"] },
      { "text": "Analog vs. digital photography — I'm team film.", "tags": ["nerdy", "quirky"], "interests": ["Photography"] }
    ]
  },
  {
    "question": "What's something low-key romantic you do?",
    "answers": [
      { "text": "Saving your favorite flower in my pressed collection.", "tags": ["wholesome", "flirty"], "interests": ["Pressed flower craft"], "groups": ["Creators"] },
      { "text": "Brewing you a custom tea blend for cozy nights.", "tags": ["wholesome", "sweet"], "interests": ["Gongfu tea"], "groups": ["Foodies"] },
      { "text": "Planning a stargazing date with my telescope.", "tags": ["romantic", "nerdy"], "interests": ["Astronomy"] },
      { "text": "Knitting you a scarf with secret flirty patterns.", "tags": ["flirty", "wholesome"], "interests": ["Knitting"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "If love was a video game, what's your special ability?",
    "answers": [
      { "text": "Crafting perfect date plans with +50% charm.", "tags": ["nerdy", "flirty"], "interests": ["Craft"], "groups": ["Creators"] },
      { "text": "Geocaching your heart with precision accuracy.", "tags": ["playful", "nerdy"], "interests": ["Geocaching"], "groups": ["Adventurers"] },
      { "text": "Mixing flirty cocktails for instant vibe boosts.", "tags": ["flirty", "funny"], "interests": ["Wine Tasting and Making"], "groups": ["Foodies"] },
      { "text": "Writing love notes that crit hit emotions.", "tags": ["romantic", "nerdy"], "interests": ["Writing"], "groups": ["Book Lovers"] }
    ]
  },
  {
    "question": "What's your chaotic good dating habit?",
    "answers": [
      { "text": "Planning a hiking date but getting lost on purpose.", "tags": ["playful", "funny"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "Singing off-key karaoke to make you laugh.", "tags": ["flirty", "quirky"], "interests": ["Karaoke"], "groups": ["Music & Performance"] },
      { "text": "Gifting a quirky seashell from my collection.", "tags": ["wholesome", "flirty"], "interests": ["Seashell collecting"], "groups": ["Collectors"] },
      { "text": "Texting you birdwatching photos at 6 a.m.", "tags": ["quirky", "sweet"], "interests": ["Birdwatching"], "groups": ["Nature Lovers"] }
    ]
  },
  {
    "question": "What would your relationship villain name be?",
    "answers": [
      { "text": "The Quilter of Chaos — stitching drama lovingly.", "tags": ["sassy", "funny"], "interests": ["Quilting"], "groups": ["Creators"] },
      { "text": "Captain Kayak Ghost — I paddle away silently.", "tags": ["flirty", "quirky"], "interests": ["Kayaking"], "groups": ["Adventurers"] },
      { "text": "DJ Heartbreak — spinning breakup beats.", "tags": ["funny", "nerdy"], "interests": ["DJing"], "groups": ["Music & Performance"] },
      { "text": "The Coin Collector — hoarding feelings too.", "tags": ["quirky", "funny"], "interests": ["Coin Collecting"], "groups": ["Collectors"] }
    ]
  },
  {
    "question": "What's your vibe on a first kiss?",
    "answers": [
      { "text": "After a pottery session, clay-covered and giggling.", "tags": ["flirty", "romantic"], "interests": ["Pottery"], "groups": ["Creators"] },
      { "text": "Post-tennis match, sweaty and victorious.", "tags": ["playful", "flirty"], "interests": ["Tennis"], "groups": ["Sports Enthusiasts"] },
      { "text": "During a stargazing night, under a meteor shower.", "tags": ["romantic", "nerdy"], "interests": ["Astronomy"] },
      { "text": "After a heated anime debate, mid-laugh.", "tags": ["flirty", "nerdy"], "interests": ["Animation"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "What's your comfort date idea?",
    "answers": [
      { "text": "Binge-watching anime with homemade sushi.", "tags": ["wholesome", "nerdy"], "interests": ["Cooking", "Animation"], "groups": ["Foodies", "Anime Addicts"] },
      { "text": "Gardening together and naming our plants.", "tags": ["wholesome", "sweet"], "interests": ["Gardening"], "groups": ["Nature Lovers"] },
      { "text": "Board game night with flirty wagers.", "tags": ["playful", "nerdy"], "interests": ["Board Games"], "groups": ["Gamers"] },
      { "text": "Quilling art while sharing life stories.", "tags": ["romantic", "quirky"], "interests": ["Quilling"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "How do you know you're catching feelings?",
    "answers": [
      { "text": "I save your favorite hiking trail on my map app.", "tags": ["flirty", "sweet"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "I start brewing coffee just for your taste.", "tags": ["wholesome", "romantic"], "interests": ["Coffee Roasting"], "groups": ["Foodies"] },
      { "text": "I sketch you in my journal. A lot.", "tags": ["flirty", "nerdy"], "interests": ["Sketching"], "groups": ["Creators"] },
      { "text": "I debate anime ships with you in mind.", "tags": ["nerdy", "sweet"], "interests": ["Animation"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "What's your weirdest dating ick?",
    "answers": [
      { "text": "Hating on my vinyl record collection. Nope.", "tags": ["sassy", "funny"], "interests": ["Vinyl Records"], "groups": ["Collectors"] },
      { "text": "Not vibing with my yoga flow. Major red flag.", "tags": ["quirky", "playful"], "interests": ["Yoga"], "groups": ["Sports Enthusiasts"] },
      { "text": "Saying my robot builds are 'just toys.'", "tags": ["nerdy", "sassy"], "interests": ["Robotics & Robot Competitions"], "groups": ["Tech Hobbyists"] },
      { "text": "Not getting my love for crosswords. Dealbreaker.", "tags": ["funny", "nerdy"], "interests": ["Crossword Puzzles"] }
    ]
  },
  {
    "question": "What's your relationship aesthetic?",
    "answers": [
      { "text": "Two adventurers lost in a forest, vibing.", "tags": ["romantic", "wholesome"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "Crafty duo making art and chaos together.", "tags": ["flirty", "quirky"], "interests": ["Craft"], "groups": ["Creators"] },
      { "text": "Foodies sharing quirky recipes and kisses.", "tags": ["flirty", "sweet"], "interests": ["Recipe creation"], "groups": ["Foodies"] },
      { "text": "Nerdy coders debugging life side by side.", "tags": ["nerdy", "wholesome"], "interests": ["Coding"], "groups": ["Tech Hobbyists"] }
    ]
  },
  {
    "question": "Your heart flutters when someone…",
    "answers": [
      { "text": "Joins you for a sunrise surf session.", "tags": ["flirty", "romantic"], "interests": ["Surfing"], "groups": ["Adventurers"] },
      { "text": "Sings your favorite song off-key but with passion.", "tags": ["wholesome", "sweet"], "interests": ["Singing"], "groups": ["Music & Performance"] },
      { "text": "Gets your rare stamp obsession without judgment.", "tags": ["flirty", "nerdy"], "interests": ["Stamp collecting"], "groups": ["Collectors"] },
      { "text": "Shares your love for bonsai pruning.", "tags": ["wholesome", "quirky"], "interests": ["Bonsai"], "groups": ["Nature Lovers"] }
    ]
  },
  {
    "question": "How would your friends describe your love life?",
    "answers": [
      { "text": "A rom-com with too many pottery disasters.", "tags": ["funny", "quirky"], "interests": ["Pottery"], "groups": ["Creators"] },
      { "text": "A hiking trail of chaotic flirtations.", "tags": ["playful", "funny"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "A foodie saga with extra spice and sass.", "tags": ["wholesome", "sassy"], "interests": ["Cooking"], "groups": ["Foodies"] },
      { "text": "A debate club with flirty undertones.", "tags": ["flirty", "nerdy"], "interests": ["Debate"], "groups": ["Social & Cultural"] }
    ]
  },
  {
    "question": "What's your go-to move when flirting?",
    "answers": [
      { "text": "Gifting a hand-carved wooden trinket.", "tags": ["flirty", "sweet"], "interests": ["Wood carving"], "groups": ["Creators"] },
      { "text": "Challenging you to a flirty table tennis match.", "tags": ["playful", "flirty"], "interests": ["Table tennis"], "groups": ["Sports Enthusiasts"] },
      { "text": "Sending a coded love note via ham radio.", "tags": ["nerdy", "flirty"], "interests": ["Ham Radio"], "groups": ["Tech Hobbyists"] },
      { "text": "Quoting poetry during a bookstore date.", "tags": ["romantic", "nerdy"], "interests": ["Poetry"], "groups": ["Book Lovers"] }
    ]
  },
  {
    "question": "If we had a secret handshake, what would it include?",
    "answers": [
      { "text": "A twirl from ballroom dancing and a wink.", "tags": ["flirty", "playful"], "interests": ["Ballroom Dancing"], "groups": ["Music & Performance"] },
      { "text": "A geocaching high-five and a treasure nod.", "tags": ["nerdy", "playful"], "interests": ["Geocaching"], "groups": ["Adventurers"] },
      { "text": "A quilling swirl and a flirty fist bump.", "tags": ["quirky", "flirty"], "interests": ["Quilling"], "groups": ["Creators"] },
      { "text": "A chess move mimic and a sneaky smile.", "tags": ["nerdy", "funny"], "interests": ["Chess"], "groups": ["Gamers"] }
    ]
  },
  {
    "question": "What's your favorite kind of romantic chaos?",
    "answers": [
      { "text": "Getting lost birdwatching and flirting with binoculars.", "tags": ["funny", "flirty"], "interests": ["Birdwatching"], "groups": ["Nature Lovers"] },
      { "text": "Baking a cake and starting a flour fight.", "tags": ["playful", "wholesome"], "interests": ["Baking"], "groups": ["Foodies"] },
      { "text": "Cosplaying at a con and stealing the spotlight.", "tags": ["nerdy", "flirty"], "interests": ["Cosplaying"], "groups": ["Anime Addicts"] },
      { "text": "Debating philosophy until we kiss to agree.", "tags": ["romantic", "nerdy"], "interests": ["Philosophy"], "groups": ["Social & Cultural"] }
    ]
  },
  {
    "question": "What's your dream nerd date?",
    "answers": [
      { "text": "Coding a flirty chatbot for our date night.", "tags": ["nerdy", "flirty"], "interests": ["Coding"], "groups": ["Tech Hobbyists"] },
      { "text": "Marathoning manga and arguing best ships.", "tags": ["nerdy", "playful"], "interests": ["Manga"], "groups": ["Anime Addicts"] },
      { "text": "Building a model rocket and launching it together.", "tags": ["nerdy", "wholesome"], "interests": ["Aerospace"] },
      { "text": "Solving a puzzle escape room with flirty clues.", "tags": ["nerdy", "playful"], "interests": ["Puzzles"] }
    ]
  },
  {
    "question": "How do you show someone you like them?",
    "answers": [
      { "text": "Gifting a hand-stitched embroidery of our initials.", "tags": ["wholesome", "flirty"], "interests": ["Embroidery"], "groups": ["Creators"] },
      { "text": "Planning a kayaking date with a picnic twist.", "tags": ["romantic", "sweet"], "interests": ["Kayaking", "Picnicking"], "groups": ["Adventurers", "Foodies"] },
      { "text": "Singing a duet at karaoke night for you.", "tags": ["flirty", "romantic"], "interests": ["Singing"], "groups": ["Music & Performance"] },
      { "text": "Sharing my rare crystal collection's best piece.", "tags": ["sweet", "nerdy"], "interests": ["Crystals"], "groups": ["Collectors"] }
    ]
  },
  {
    "question": "Which fictional couple are you most like?",
    "answers": [
      { "text": "WALL-E & EVE — quirky tech love story.", "tags": ["nerdy", "wholesome"], "interests": ["Animation"], "groups": ["Anime Addicts"] },
      { "text": "Aragorn & Arwen — epic hikes and romance.", "tags": ["romantic", "nerdy"], "interests": ["Hiking", "Reading"], "groups": ["Adventurers", "Book Lovers"] },
      { "text": "Han & Leia — sassy banter, galactic vibes.", "tags": ["flirty", "sassy"], "interests": ["Filmmaking"], "groups": ["Movie Aficionados"] },
      { "text": "Totoro & Mei — wholesome forest adventures.", "tags": ["wholesome", "sweet"], "interests": ["Animation"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "What's your ideal lazy Sunday with a date?",
    "answers": [
      { "text": "Terrarium building and naming our tiny plants.", "tags": ["wholesome", "quirky"], "interests": ["Terrariums"], "groups": ["Nature Lovers"] },
      { "text": "Binge-playing board games with flirty bets.", "tags": ["playful", "nerdy"], "interests": ["Board Games"], "groups": ["Gamers"] },
      { "text": "Baking cookies and arguing over chocolate chips.", "tags": ["wholesome", "funny"], "interests": ["Baking"], "groups": ["Foodies"] },
      { "text": "Reading poetry in bed with lazy cuddles.", "tags": ["romantic", "sweet"], "interests": ["Poetry"], "groups": ["Book Lovers"] }
    ]
  },
  {
    "question": "Which emoji are you in a relationship?",
    "answers": [
      { "text": "🌱 — Growing feelings, rooted in chill vibes.", "tags": ["wholesome", "sweet"], "interests": ["Gardening"], "groups": ["Nature Lovers"] },
      { "text": "🎮 — Player one, ready for co-op love.", "tags": ["nerdy", "playful"], "interests": ["Gaming"], "groups": ["Gamers"] },
      { "text": "🎨 — Painting our love story with chaos.", "tags": ["flirty", "quirky"], "interests": ["Painting"], "groups": ["Creators"] },
      { "text": "🥐 — Warm, flirty, and a little buttery.", "tags": ["flirty", "funny"], "interests": ["Baking"], "groups": ["Foodies"] }
    ]
  },
  {
    "question": "What's your romantic villain origin story?",
    "answers": [
      { "text": "They dissed my beekeeping. I'm buzzing with rage.", "tags": ["sassy", "funny"], "interests": ["Beekeeping"], "groups": ["Nature Lovers"] },
      { "text": "They said my manga collection was 'childish.'", "tags": ["nerdy", "sassy"], "interests": ["Manga"], "groups": ["Anime Addicts"] },
      { "text": "They hated my homebrewed beer. Unforgivable.", "tags": ["funny", "judgy"], "interests": ["Homebrewing"], "groups": ["Foodies"] },
      { "text": "They mocked my lock-picking skills. Locked out forever.", "tags": ["quirky", "sassy"], "interests": ["Lock picking"], "groups": ["Tech Hobbyists"] }
    ]
  },
  {
    "question": "What's something wholesome you lowkey love?",
    "answers": [
      { "text": "Volunteering at animal shelters with extra cuddles.", "tags": ["wholesome", "sweet"], "interests": ["Volunteering"], "groups": ["Social & Cultural"] },
      { "text": "Arranging flowers for friends just because.", "tags": ["wholesome", "flirty"], "interests": ["Flower Arranging & Collecting"], "groups": ["Creators"] },
      { "text": "Collecting seashells to gift on random dates.", "tags": ["sweet", "quirky"], "interests": ["Seashell collecting"], "groups": ["Collectors"] },
      { "text": "Watching butterflies and naming them after you.", "tags": ["romantic", "nerdy"], "interests": ["Butterfly Watching"], "groups": ["Nature Lovers"] }
    ]
  },
  {
    "question": "If we had a reality show, what would it be called?",
    "answers": [
      { "text": "Love, Crafts, and Chaos", "tags": ["funny", "quirky"], "interests": ["Craft"], "groups": ["Creators"] },
      { "text": "Swipe Right for Adventure", "tags": ["playful", "flirty"], "interests": ["Travel"], "groups": ["Adventurers"] },
      { "text": "Cooking Up Chemistry", "tags": ["funny", "romantic"], "interests": ["Cooking"], "groups": ["Foodies"] }
    ]
  },
  {
    "question": "What's your toxic dating era?",
    "answers": [
      { "text": "I dated someone who hated my pottery wheel.", "tags": ["funny", "sassy"], "interests": ["Pottery"], "groups": ["Creators"] },
      { "text": "I ghosted over bad taste in vinyl records.", "tags": ["quirky", "funny"], "interests": ["Vinyl Records"], "groups": ["Collectors"] },
      { "text": "I fell for someone just for their hiking gear.", "tags": ["funny", "self-aware"], "interests": ["Hiking"], "groups": ["Adventurers"] }
    ]
  },
  {
    "question": "You have 24 hours to spend a million dollars. What do you do?",
    "answers": [
      { "text": "Buy a vineyard for epic wine-tasting dates.", "tags": ["flirty", "funny"], "interests": ["Wine Tasting and Making"], "groups": ["Foodies"] },
      { "text": "Fund a robotics lab for flirty AI projects.", "tags": ["nerdy", "quirky"], "interests": ["Robotics & Robot Competitions"], "groups": ["Tech Hobbyists"] },
      { "text": "Build a skatepark for chaotic date nights.", "tags": ["playful", "funny"], "interests": ["Skateboarding"], "groups": ["Sports Enthusiasts"] }
    ]
  },
  {
    "question": "What movie do you irrationally quote?",
    "answers": [
      { "text": "Spirited Away — every line, every vibe.", "tags": ["nerdy", "quirky"], "interests": ["Animation"], "groups": ["Anime Addicts"] },
      { "text": "The Matrix — I'm Neo in every argument.", "tags": ["nerdy", "sassy"], "interests": ["Filmmaking"], "groups": ["Movie Aficionados"] },
      { "text": "Clueless — I'm basically Cher at heart.", "tags": ["funny", "sassy"], "interests": ["Videography"], "groups": ["Movie Aficionados"] }
    ]
  },
  {
    "question": "What's your most controversial opinion?",
    "answers": [
      { "text": "Kombucha is just spicy soda. Fight me.", "tags": ["funny", "sassy"], "interests": ["Kombucha brewing"], "groups": ["Foodies"] },
      { "text": "Yoga is just fancy stretching. Prove me wrong.", "tags": ["quirky", "sassy"], "interests": ["Yoga"], "groups": ["Sports Enthusiasts"] },
      { "text": "Manga is better than novels sometimes.", "tags": ["nerdy", "controversial"], "interests": ["Manga"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "What do you bring to a relationship?",
    "answers": [
      { "text": "Homemade candles and chaotic flirt energy.", "tags": ["flirty", "quirky"], "interests": ["Candle Making"], "groups": ["Creators"] },
      { "text": "Geocaching adventures and witty banter.", "tags": ["playful", "funny"], "interests": ["Geocaching"], "groups": ["Adventurers"] },
      { "text": "Karaoke skills and endless snack recipes.", "tags": ["funny", "wholesome"], "interests": ["Karaoke", "Cooking"], "groups": ["Music & Performance", "Foodies"] }
    ]
  },
  {
    "question": "If your love life was a meme, what would it be?",
    "answers": [
      { "text": "Distracted Boyfriend, but I'm chasing snacks.", "tags": ["funny", "quirky"], "interests": ["Cooking"], "groups": ["Foodies"] },
      { "text": "Drake meme: rejecting boring, choosing adventure.", "tags": ["sassy", "playful"], "interests": ["Travel"], "groups": ["Adventurers"] },
      { "text": "Spongebob panicking over my pottery fails.", "tags": ["funny", "quirky"], "interests": ["Pottery"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "What's a red flag you *ignored* and paid for?",
    "answers": [
      { "text": "They said my bonsai was 'just a plant.'", "tags": ["sassy", "funny"], "interests": ["Bonsai"], "groups": ["Nature Lovers"] },
      { "text": "They hated board games. Should've run.", "tags": ["nerdy", "funny"], "interests": ["Board Games"], "groups": ["Gamers"] },
      { "text": "They called my coding 'nerd nonsense.'", "tags": ["sassy", "nerdy"], "interests": ["Coding"], "groups": ["Tech Hobbyists"] }
    ]
  },
  {
    "question": "If your ex had to describe you in 3 words?",
    "answers": [
      { "text": "Obsessed with manga.", "tags": ["nerdy", "funny"], "interests": ["Manga"], "groups": ["Anime Addicts"] },
      { "text": "Always baking chaos.", "tags": ["quirky", "wholesome"], "interests": ["Baking"], "groups": ["Foodies"] },
      { "text": "Hopeless hiking romantic.", "tags": ["romantic", "funny"], "interests": ["Hiking"], "groups": ["Adventurers"] }
    ]
  },
  {
    "question": "What's a hill you'll die on?",
    "answers": [
      { "text": "Vinyl records sound better than streaming.", "tags": ["nerdy", "sassy"], "interests": ["Vinyl Records"], "groups": ["Collectors"] },
      { "text": "Pickleball is the ultimate date sport.", "tags": ["playful", "funny"], "interests": ["Pickleball"], "groups": ["Sports Enthusiasts"] },
      { "text": "Homebrewing beats store-bought beer.", "tags": ["sassy", "quirky"], "interests": ["Homebrewing"], "groups": ["Foodies"] }
    ]
  },
  {
    "question": "What's your ideal first date?",
    "answers": [
      { "text": "Exploring a bookstore and writing flirty notes.", "tags": ["wholesome", "romantic"], "interests": ["Book Collecting"], "groups": ["Book Lovers"] },
      { "text": "Skateboarding and sharing quirky street food.", "tags": ["playful", "funny"], "interests": ["Skateboarding"], "groups": ["Sports Enthusiasts"] },
      { "text": "Building a terrarium with flirty banter.", "tags": ["sweet", "quirky"], "interests": ["Terrariums"], "groups": ["Nature Lovers"] }
    ]
  },
  {
    "question": "What would a warning label on you say?",
    "answers": [
      { "text": "Caution: May break into song mid-date.", "tags": ["funny", "quirky"], "interests": ["Singing"], "groups": ["Music & Performance"] },
      { "text": "Warning: Overthinks every chess move.", "tags": ["nerdy", "funny"], "interests": ["Chess"], "groups": ["Gamers"] },
      { "text": "Danger: Hoards rare coins and feelings.", "tags": ["quirky", "flirty"], "interests": ["Coin Collecting"], "groups": ["Collectors"] }
    ]
  },
  {
    "question": "What kind of weird do you bring to the table?",
    "answers": [
      { "text": "I narrate my hikes like a fantasy novel.", "tags": ["quirky", "nerdy"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "I name my plants after anime characters.", "tags": ["nerdy", "funny"], "interests": ["Bonsai"], "groups": ["Nature Lovers"] },
      { "text": "I solve puzzles to avoid awkward silences.", "tags": ["quirky", "nerdy"], "interests": ["Puzzles"] }
    ]
  },
  {
    "question": "What's your love language… *but make it weird*?",
    "answers": [
      { "text": "Gifting you a custom 3D-printed trinket.", "tags": ["quirky", "flirty"], "interests": ["3D printing"], "groups": ["Creators"] },
      { "text": "Sending you photos of my aquascaping tank.", "tags": ["nerdy", "sweet"], "interests": ["Aquascaping"], "groups": ["Nature Lovers"] },
      { "text": "Writing flirty code comments in Python.", "tags": ["nerdy", "flirty"], "interests": ["Coding"], "groups": ["Tech Hobbyists"] }
    ]
  },
  {
    "question": "If you were a cocktail, what would you be?",
    "answers": [
      { "text": "A spicy kombucha spritz — bubbly and bold.", "tags": ["flirty", "quirky"], "interests": ["Kombucha brewing"], "groups": ["Foodies"] },
      { "text": "A hiking trail mojito — minty and adventurous.", "tags": ["playful", "funny"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "A vinyl martini — smooth with retro vibes.", "tags": ["nerdy", "flirty"], "interests": ["Vinyl Records"], "groups": ["Collectors"] }
    ]
  },
  {
    "question": "What's your toxic trait (in a fun way)?",
    "answers": [
      { "text": "I get competitive over board games. Ruthlessly.", "tags": ["funny", "sassy"], "interests": ["Board Games"], "groups": ["Gamers"] },
      { "text": "I name every fish in my tank after exes.", "tags": ["quirky", "funny"], "interests": ["Fishkeeping"], "groups": ["Nature Lovers"] },
      { "text": "I overanalyze every pottery project's vibe.", "tags": ["nerdy", "quirky"], "interests": ["Pottery"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "You wake up as a potato. What's your next move?",
    "answers": [
      { "text": "Roll into a chef's kitchen for a fancy mash.", "tags": ["funny", "quirky"], "interests": ["Cooking"], "groups": ["Foodies"] },
      { "text": "Become a geocaching treasure for adventurers.", "tags": ["playful", "absurd"], "interests": ["Geocaching"], "groups": ["Adventurers"] },
      { "text": "Star in a quirky stop-motion animation.", "tags": ["nerdy", "funny"], "interests": ["Animation"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "What's your dating green flag?",
    "answers": [
      { "text": "You love my quirky origami creations.", "tags": ["flirty", "sweet"], "interests": ["Origami"], "groups": ["Creators"] },
      { "text": "You vibe with my hiking playlist.", "tags": ["playful", "romantic"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "You geek out over my rare stamp finds.", "tags": ["nerdy", "flirty"], "interests": ["Stamp collecting"], "groups": ["Collectors"] }
    ]
  },
  {
    "question": "What's something you irrationally fear?",
    "answers": [
      { "text": "Losing my favorite knitting needles.", "tags": ["quirky", "funny"], "interests": ["Knitting"], "groups": ["Creators"] },
      { "text": "Forgetting my lines in a karaoke duet.", "tags": ["funny", "nerdy"], "interests": ["Karaoke"], "groups": ["Music & Performance"] },
      { "text": "My code crashing during a date demo.", "tags": ["nerdy", "relatable"], "interests": ["Coding"], "groups": ["Tech Hobbyists"] }
    ]
  },
  {
    "question": "Your personal theme song?",
    "answers": [
      { "text": "'Sweet Caroline' for epic karaoke nights.", "tags": ["funny", "playful"], "interests": ["Karaoke"], "groups": ["Music & Performance"] },
      { "text": "'Bohemian Rhapsody' for my crafting chaos.", "tags": ["quirky", "funny"], "interests": ["Craft"], "groups": ["Creators"] },
      { "text": "'Africa' for my hiking adventures.", "tags": ["romantic", "playful"], "interests": ["Hiking"], "groups": ["Adventurers"] }
    ]
  },
  {
    "question": "What would be your weapon in a zombie apocalypse?",
    "answers": [
      { "text": "A 3D-printed crossbow — stylish and deadly.", "tags": ["nerdy", "funny"], "interests": ["3D printing"], "groups": ["Creators"] },
      { "text": "My skateboard — zoom away in style.", "tags": ["playful", "quirky"], "interests": ["Skateboarding"], "groups": ["Sports Enthusiasts"] },
      { "text": "A speaker blasting my DJ mix to stun zombies.", "tags": ["funny", "nerdy"], "interests": ["DJing"], "groups": ["Music & Performance"] }
    ]
  },
  {
    "question": "What's your version of a red flag?",
    "answers": [
      { "text": "Hating my terrarium aesthetic. Nope.", "tags": ["sassy", "funny"], "interests": ["Terrariums"], "groups": ["Nature Lovers"] },
      { "text": "Not vibing with my anime marathons.", "tags": ["nerdy", "sassy"], "interests": ["Animation"], "groups": ["Anime Addicts"] },
      { "text": "Calling my coding 'just typing.' Rude.", "tags": ["nerdy", "judgy"], "interests": ["Coding"], "groups": ["Tech Hobbyists"] }
    ]
  },
  {
    "question": "What's your superpower in relationships?",
    "answers": [
      { "text": "Crafting flirty gifts that hit the heart.", "tags": ["flirty", "sweet"], "interests": ["Craft"], "groups": ["Creators"] },
      { "text": "Planning epic hiking dates with views.", "tags": ["romantic", "playful"], "interests": ["Hiking"], "groups": ["Adventurers"] },
      { "text": "Sensing when you need a homemade dessert.", "tags": ["wholesome", "funny"], "interests": ["Baking"], "groups": ["Foodies"] }
    ]
  },
  {
    "question": "What's your 'bare minimum is too much' trait?",
    "answers": [
      { "text": "Overanalyzing my cosplay wigs before a date.", "tags": ["nerdy", "funny"], "interests": ["Cosplaying"], "groups": ["Anime Addicts"] },
      { "text": "Perfecting my coffee brew for you.", "tags": ["quirky", "sweet"], "interests": ["Coffee Roasting"], "groups": ["Foodies"] },
      { "text": "Rewriting my poetry for the perfect vibe.", "tags": ["romantic", "nerdy"], "interests": ["Poetry"], "groups": ["Book Lovers"] }
    ]
  },
  {
    "question": "Describe your flirting style.",
    "answers": [
      { "text": "Playful like a beach volleyball rally.", "tags": ["flirty", "playful"], "interests": ["Beach Volleyball"], "groups": ["Sports Enthusiasts"] },
      { "text": "Nerdy like a coded love message.", "tags": ["nerdy", "flirty"], "interests": ["Coding"], "groups": ["Tech Hobbyists"] },
      { "text": "Sweet like a homemade candy gift.", "tags": ["flirty", "sweet"], "interests": ["Candy Making"], "groups": ["Foodies"] }
    ]
  },
  {
    "question": "What's your dream date activity from your hobby list?",
    "answers": [
      { "text": "Sculpting a quirky statue together, laughing at our fails.", "tags": ["funny", "wholesome"], "interests": ["Sculpting"], "groups": ["Creators"] },
      { "text": "Kayaking to a hidden cove for a flirty picnic.", "tags": ["romantic", "playful"], "interests": ["Kayaking"], "groups": ["Adventurers"] },
      { "text": "Reading manga aloud with dramatic voices.", "tags": ["nerdy", "flirty"], "interests": ["Manga"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "What's your go-to way to impress a date with your skills?",
    "answers": [
      { "text": "Brewing a perfect coffee with latte art.", "tags": ["flirty", "wholesome"], "interests": ["Coffee Roasting"], "groups": ["Foodies"] },
      { "text": "Teaching you a salsa dance move mid-date.", "tags": ["flirty", "playful"], "interests": ["Dancing"], "groups": ["Music & Performance"] },
      { "text": "Showing off my rare coin collection's shine.", "tags": ["nerdy", "flirty"], "interests": ["Coin Collecting"], "groups": ["Collectors"] }
    ]
  },
  {
    "question": "What's your chaotic date idea inspired by your passions?",
    "answers": [
      { "text": "Skateboarding through a park with flirty tricks.", "tags": ["funny", "playful"], "interests": ["Skateboarding"], "groups": ["Sports Enthusiasts"] },
      { "text": "Building a robot that flirts for us.", "tags": ["nerdy", "quirky"], "interests": ["Robotics & Robot Competitions"], "groups": ["Tech Hobbyists"] },
      { "text": "Crafting a chaotic diorama of our date.", "tags": ["funny", "quirky"], "interests": ["Diorama"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "What's a hobby you'd teach your date to win them over?",
    "answers": [
      { "text": "Calligraphy for flirty love notes.", "tags": ["flirty", "romantic"], "interests": ["Calligraphy"], "groups": ["Creators"] },
      { "text": "Birdwatching to spot lovebirds together.", "tags": ["wholesome", "sweet"], "interests": ["Birdwatching"], "groups": ["Nature Lovers"] },
      { "text": "Chess with playful wagers for kisses.", "tags": ["flirty", "nerdy"], "interests": ["Chess"], "groups": ["Gamers"] }
    ]
  },
  {
    "question": "What's your ideal date vibe based on your favorite activity?",
    "answers": [
      { "text": "Painting a mural with flirty splashes.", "tags": ["romantic", "playful"], "interests": ["Painting"], "groups": ["Creators"] },
      { "text": "Singing duets at a cozy karaoke night.", "tags": ["flirty", "sweet"], "interests": ["Singing"], "groups": ["Music & Performance"] },
      { "text": "Hiking with a picnic of homemade treats.", "tags": ["wholesome", "romantic"], "interests": ["Hiking", "Picnicking"], "groups": ["Adventurers", "Foodies"] }
    ]
  },
  {
    "question": "What's your nerdiest date pitch?",
    "answers": [
      { "text": "Hacking a flirty app for our date night.", "tags": ["nerdy", "flirty"], "interests": ["Hacking"], "groups": ["Tech Hobbyists"] },
      { "text": "Marathoning anime with custom subtitles.", "tags": ["nerdy", "playful"], "interests": ["Animation"], "groups": ["Anime Addicts"] },
      { "text": "Writing a sci-fi story starring us.", "tags": ["nerdy", "romantic"], "interests": ["Story Writing"], "groups": ["Book Lovers"] }
    ]
  },
  {
    "question": "What's a quirky gift you'd make for a date?",
    "answers": [
      { "text": "A hand-stitched quilt with our initials.", "tags": ["flirty", "sweet"], "interests": ["Quilting"], "groups": ["Creators"] },
      { "text": "A rare seashell with a flirty note inside.", "tags": ["romantic", "quirky"], "interests": ["Seashell collecting"], "groups": ["Collectors"] },
      { "text": "A custom playlist for our hiking date.", "tags": ["flirty", "playful"], "interests": ["Hiking"], "groups": ["Adventurers"] }
    ]
  },
  {
    "question": "What's your ultimate adventure date?",
    "answers": [
      { "text": "Skydiving with flirty mid-air banter.", "tags": ["flirty", "playful"], "interests": ["Skydiving"], "groups": ["Adventurers"] },
      { "text": "Caving with glow-in-the-dark love notes.", "tags": ["romantic", "nerdy"], "interests": ["Caving"], "groups": ["Adventurers"] },
      { "text": "Surfing and sharing beachside coffee.", "tags": ["flirty", "wholesome"], "interests": ["Surfing"], "groups": ["Adventurers"] }
    ]
  },
  {
    "question": "What's your foodie date fantasy?",
    "answers": [
      { "text": "Brewing kombucha for a flirty tasting.", "tags": ["flirty", "quirky"], "interests": ["Kombucha brewing"], "groups": ["Foodies"] },
      { "text": "Making candy with heart-shaped molds.", "tags": ["sweet", "romantic"], "interests": ["Candy Making"], "groups": ["Foodies"] },
      { "text": "Cooking a spicy dinner with flirty dares.", "tags": ["flirty", "playful"], "interests": ["Cooking"], "groups": ["Foodies"] }
    ]
  },
  {
    "question": "What's your artsy date flex?",
    "answers": [
      { "text": "Sculpting a quirky gift for you.", "tags": ["romantic", "quirky"], "interests": ["Sculpting"], "groups": ["Creators"] },
      { "text": "Filming a short rom-com about us.", "tags": ["flirty", "nerdy"], "interests": ["Videography"], "groups": ["Movie Aficionados"] },
      { "text": "Writing a flirty poem in calligraphy.", "tags": ["romantic", "sweet"], "interests": ["Calligraphy"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "What's your anime-inspired date vibe?",
    "answers": [
      { "text": "Cosplaying and crashing an anime con.", "tags": ["playful", "nerdy"], "interests": ["Cosplaying"], "groups": ["Anime Addicts"] },
      { "text": "Watching manga adaptations with sushi.", "tags": ["wholesome", "nerdy"], "interests": ["Manga"], "groups": ["Anime Addicts"] },
      { "text": "Animating a love note in pixel art.", "tags": ["flirty", "nerdy"], "interests": ["Animation"], "groups": ["Anime Addicts"] }
    ]
  },
  {
    "question": "What's your bookish way to flirt?",
    "answers": [
      { "text": "Gifting a book with flirty annotations.", "tags": ["flirty", "romantic"], "interests": ["Book Collecting"], "groups": ["Book Lovers"] },
      { "text": "Reading poetry with dramatic flair.", "tags": ["romantic", "nerdy"], "interests": ["Poetry"], "groups": ["Book Lovers"] },
      { "text": "Writing you into my fantasy novel.", "tags": ["flirty", "nerdy"], "interests": ["Story Writing"], "groups": ["Book Lovers"] }
    ]
  },
  {
    "question": "What's your gaming date power move?",
    "answers": [
      { "text": "Letting you win at chess for a kiss.", "tags": ["flirty", "playful"], "interests": ["Chess"], "groups": ["Gamers"] },
      { "text": "Team-up in esports with flirty callouts.", "tags": ["nerdy", "flirty"], "interests": ["Esports"], "groups": ["Gamers"] },
      { "text": "Crafting a D&D love story for us.", "tags": ["romantic", "nerdy"], "interests": ["Role-playing Games"], "groups": ["Gamers"] }
    ]
  },
  {
    "question": "What's your outdoor date fantasy?",
    "answers": [
      { "text": "Skiing and cuddling by a lodge fire.", "tags": ["romantic", "wholesome"], "interests": ["Skiing"], "groups": ["Adventurers"] },
      { "text": "Geocaching for treasure and flirty clues.", "tags": ["playful", "flirty"], "interests": ["Geocaching"], "groups": ["Adventurers"] },
      { "text": "Camping with ghost stories and cuddles.", "tags": ["romantic", "nerdy"], "interests": ["Camping"], "groups": ["Adventurers"] }
    ]
  },
  {
    "question": "What's your quirky way to bond over crafts?",
    "answers": [
      { "text": "Making soap with flirty scents.", "tags": ["flirty", "quirky"], "interests": ["Soapmaking"], "groups": ["Creators"] },
      { "text": "Quilling love notes for each other.", "tags": ["romantic", "sweet"], "interests": ["Quilling"], "groups": ["Creators"] },
      { "text": "Painting rocks with our date vibes.", "tags": ["playful", "wholesome"], "interests": ["Rock painting"], "groups": ["Creators"] }
    ]
  },
  {
    "question": "What's your foodie flirting style?",
    "answers": [
      { "text": "Brewing coffee with a flirty latte heart.", "tags": ["flirty", "sweet"], "interests": ["Coffee Roasting"], "groups": ["Foodies"] },
      { "text": "Making candy with your name in sugar.", "tags": ["romantic", "quirky"], "interests": ["Candy Making"], "groups": ["Foodies"] },
      { "text": "Cooking spicy tacos with a wink.", "tags": ["flirty", "playful"], "interests": ["Cooking"], "groups": ["Foodies"] }
    ]
  },
  {
    "question": "What's your movie-inspired date idea?",
    "answers": [
      { "text": "Filming a goofy spy short film.", "tags": ["funny", "playful"], "interests": ["Filmmaking"], "groups": ["Movie Aficionados"] },
      { "text": "Watching anime with flirty commentary.", "tags": ["nerdy", "flirty"], "interests": ["Animation"], "groups": ["Anime Addicts"] },
      { "text": "Recreating a rom-com café scene.", "tags": ["romantic", "funny"], "interests": ["Videography"], "groups": ["Movie Aficionados"] }
    ]
  },
  {
    "question": "What's your dream hobby mashup date?",
    "answers": [
      { "text": "Hiking and painting the sunset together.", "tags": ["romantic", "wholesome"], "interests": ["Hiking", "Painting"], "groups": ["Adventurers", "Creators"] },
      { "text": "Cooking anime-themed bento for a picnic.", "tags": ["wholesome", "nerdy"], "interests": ["Cooking", "Animation"], "groups": ["Foodies", "Anime Addicts"] },
      { "text": "Gaming and writing a sci-fi love story.", "tags": ["nerdy", "romantic"], "interests": ["Gaming", "Story Writing"], "groups": ["Gamers", "Book Lovers"] }
    ]
  },
  {
    "question": "What's your ultimate hobby flex on a date?",
    "answers": [
      { "text": "Carving a heart-shaped wooden gift.", "tags": ["flirty", "romantic"], "interests": ["Wood carving"], "groups": ["Creators"] },
      { "text": "Leading a flirty birdwatching adventure.", "tags": ["sweet", "playful"], "interests": ["Birdwatching"], "groups": ["Nature Lovers"] },
      { "text": "Winning at esports with a flirty wink.", "tags": ["flirty", "nerdy"], "interests": ["Esports"], "groups": ["Gamers"] }
    ]
  }
];