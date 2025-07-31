export interface Answer {
  text: string;
  tags: string[];
}

export interface Question {
  question: string;
  answers: Answer[];
}

export const connectionsQuestions: Question[] = [
  {
    "question": "What's your toxic trait (in a fun way)?",
    "answers": [
      { "text": "I believe every meal can be improved by hot sauce… even ice cream. Don't judge me until you've tried it.", "tags": ["funny", "quirky"] },
      { "text": "I rewrite texts 6 times and still sound awkward.", "tags": ["introspective", "relatable"] },
      { "text": "I think every dog I see is secretly my soulmate.", "tags": ["quirky", "funny"] }
    ]
  },
  {
    "question": "You wake up as a potato. What's your next move?",
    "answers": [
      { "text": "I roll into a fryer and hope for the best. Go crispy or go home.", "tags": ["funny", "absurd"] },
      { "text": "I roll under the couch and wait for Netflix to call me back.", "tags": ["quirky", "funny"] },
      { "text": "I start a TikTok cooking series called 'Mash Me Baby One More Time.'", "tags": ["funny", "sassy"] }
    ]
  },
  {
    "question": "What's your dating green flag?",
    "answers": [
      { "text": "If you laugh at my bad puns, I will probably propose… metaphorically (at first).", "tags": ["funny", "flirty"] },
      { "text": "I'll remember your coffee order... even if we only dated for 12 hours.", "tags": ["sweet", "quirky"] },
      { "text": "I'll send you memes that match your emotional weather.", "tags": ["funny", "thoughtful"] }
    ]
  },
  {
    "question": "What's something you irrationally fear?",
    "answers": [
      { "text": "When someone says 'We need to talk' — even if it's my barista.", "tags": ["funny", "relatable"] },
      { "text": "Being the first person to say \"hi\" in a group chat.", "tags": ["quirky", "relatable"] },
      { "text": "Hitting 'Reply All' and instantly regretting existence.", "tags": ["funny", "nerdy"] }
    ]
  },
  {
    "question": "Your personal theme song?",
    "answers": [
      { "text": "'Eye of the Tiger' but it glitches every time I try something productive.", "tags": ["funny", "quirky"] },
      { "text": "'Don't Stop Believin',' but slightly off-key and in my shower voice.", "tags": ["funny", "sassy"] },
      { "text": "'I'm Still Standing' by Elton John — emotionally and barely physically.", "tags": ["relatable", "introspective"] }
    ]
  },
  {
    "question": "What would be your weapon in a zombie apocalypse?",
    "answers": [
      { "text": "A Bluetooth speaker blasting Celine Dion — the zombies would cry and leave.", "tags": ["funny", "absurd"] },
      { "text": "My crippling anxiety — it scares *everyone* off.", "tags": ["funny", "self-deprecating"] },
      { "text": "A bag of expired granola bars — for throwing, not eating.", "tags": ["quirky", "dark humor"] }
    ]
  },
  {
    "question": "What's your version of a red flag?",
    "answers": [
      { "text": "'I don't believe in naps.' 🚩", "tags": ["funny", "sassy"] },
      { "text": "Anyone who claps when the plane lands.", "tags": ["funny", "judgy"] },
      { "text": "If your favorite movie is 'Fight Club' *and* you explain it to me unsolicited.", "tags": ["sassy", "nerdy"] }
    ]
  },
  {
    "question": "What's your superpower in relationships?",
    "answers": [
      { "text": "I always remember how you like your coffee. Even after we break up.", "tags": ["thoughtful", "quirky"] },
      { "text": "I sense when you're hungry before you do.", "tags": ["funny", "sweet"] },
      { "text": "I send 'thinking of you' texts at the exact right moment.", "tags": ["flirty", "romantic"] }
    ]
  },
  {
    "question": "What's your 'bare minimum is too much' trait?",
    "answers": [
      { "text": "Responding to texts… emotionally, spiritually, and with punctuation.", "tags": ["funny", "relatable"] },
      { "text": "Replying \"haha\" to avoid emotional vulnerability.", "tags": ["funny", "introspective"] },
      { "text": "Double-texting myself to see if I seem clingy.", "tags": ["quirky", "funny"] }
    ]
  },
  {
    "question": "Describe your flirting style.",
    "answers": [
      { "text": "Somewhere between a golden retriever and a confused Roomba.", "tags": ["funny", "quirky"] },
      { "text": "Chaotic good with a dash of sarcasm.", "tags": ["flirty", "funny"] },
      { "text": "I overuse emojis and then disappear for 3 days.", "tags": ["relatable", "quirky"] }
    ]
  },
  {
    "question": "If we had a reality show, what would it be called?",
    "answers": [
      { "text": "\"Love in 180 Seconds (and Several Awkward Pauses)\"", "tags": ["funny", "quirky"] },
      { "text": "\"Swiped Right, Went Left\"", "tags": ["funny", "sassy"] },
      { "text": "\"Can't Believe It's Not Love!\"", "tags": ["funny", "absurd"] }
    ]
  },
  {
    "question": "What's your toxic dating era?",
    "answers": [
      { "text": "I once ghosted someone because they didn't like breakfast. I regret nothing.", "tags": ["funny", "sassy"] },
      { "text": "The time I pretended to like EDM. For 3 months.", "tags": ["quirky", "funny"] },
      { "text": "I once dated someone just because they had a dog.", "tags": ["funny", "self-aware"] }
    ]
  },
  {
    "question": "You have 24 hours to spend a million dollars. What do you do?",
    "answers": [
      { "text": "Adopt 100 cats and give them each a tiny house. I'd call it Purr-gatory.", "tags": ["quirky", "funny"] },
      { "text": "Buy an island, name it 'Introvert Isle,' and never explain myself again.", "tags": ["introspective", "funny"] },
      { "text": "Hire someone to teach me how taxes work.", "tags": ["relatable", "nerdy"] }
    ]
  },
  {
    "question": "What movie do you irrationally quote?",
    "answers": [
      { "text": "*Shrek* — especially the donkey parts. It's a problem.", "tags": ["funny", "quirky"] },
      { "text": "*Mean Girls.* Every. Single. Line.", "tags": ["sassy", "funny"] },
      { "text": "*Lord of the Rings.* Even during dinner arguments.", "tags": ["nerdy", "quirky"] }
    ]
  },
  {
    "question": "What's your most controversial opinion?",
    "answers": [
      { "text": "Cereal is just cold soup and we all need to accept that.", "tags": ["funny", "quirky"] },
      { "text": "Breakfast is a scam created by Big Cereal.", "tags": ["funny", "sassy"] },
      { "text": "Tacos taste better when eaten in bed.", "tags": ["funny", "relatable"] }
    ]
  },
  {
    "question": "What do you bring to a relationship?",
    "answers": [
      { "text": "Snacks. Emotional availability. And unsolicited playlists.", "tags": ["thoughtful", "funny"] },
      { "text": "Overthinking and a perfectly curated Spotify playlist.", "tags": ["relatable", "quirky"] },
      { "text": "Impeccable snack judgment and panic during IKEA trips.", "tags": ["funny", "quirky"] }
    ]
  },
  {
    "question": "If your love life was a meme, what would it be?",
    "answers": [
      { "text": "That dog sitting in a burning room saying, \"This is fine.\"", "tags": ["funny", "self-deprecating"] },
      { "text": "The guy digging two feet away from diamonds.", "tags": ["relatable", "introspective"] },
      { "text": "Me: I'm done dating. Also me: *downloads dating app again*", "tags": ["funny", "relatable"] }
    ]
  },
  {
    "question": "What's a red flag you *ignored* and paid for?",
    "answers": [
      { "text": "He said his hobby was 'networking' but it turned out to be MLM.", "tags": ["funny", "sassy"] },
      { "text": "He 'didn't believe' in seasoning food.", "tags": ["funny", "judgy"] },
      { "text": "She called her ex 'just a roommate with history.'", "tags": ["funny", "awkward"] }
    ]
  },
  {
    "question": "If your ex had to describe you in 3 words?",
    "answers": [
      { "text": "\"Too many snacks.\"", "tags": ["funny", "quirky"] },
      { "text": "\"Chronically online weirdo.\"", "tags": ["self-aware", "funny"] },
      { "text": "\"Surprisingly good cook.\"", "tags": ["wholesome", "funny"] }
    ]
  },
  {
    "question": "What's a hill you'll die on?",
    "answers": [
      { "text": "Pineapple belongs on pizza. Fight me lovingly.", "tags": ["funny", "sassy"] },
      { "text": "Crocs are footwear royalty.", "tags": ["quirky", "funny"] },
      { "text": "Avocados are overrated butter fruit.", "tags": ["funny", "controversial"] }
    ]
  },
  {
    "question": "What's your ideal first date?",
    "answers": [
      { "text": "We get coffee, walk around a bookstore, and judge book covers. Harshly.", "tags": ["wholesome", "quirky"] },
      { "text": "Arcade games, questionable pizza, and low-stakes competition.", "tags": ["funny", "playful"] },
      { "text": "Getting lost in IKEA and pretending it's our apartment.", "tags": ["quirky", "funny"] }
    ]
  },
  {
    "question": "What would a warning label on you say?",
    "answers": [
      { "text": "\"Caution: May start dancing without provocation.\"", "tags": ["quirky", "funny"] },
      { "text": "\"Sarcasm levels unstable — approach with snacks.\"", "tags": ["sassy", "funny"] },
      { "text": "\"Will emotionally attach to stray cats and fictional characters.\"", "tags": ["funny", "relatable"] }
    ]
  },
  {
    "question": "What kind of weird do you bring to the table?",
    "answers": [
      { "text": "I narrate my life like a National Geographic documentary when I'm alone.", "tags": ["quirky", "funny"] },
      { "text": "I name inanimate objects like they're pets.", "tags": ["quirky", "relatable"] },
      { "text": "I say \"ow\" when I drop things, even if I'm not hurt.", "tags": ["funny", "quirky"] }
    ]
  },
  {
    "question": "What's your love language… *but make it weird*?",
    "answers": [
      { "text": "Passive-aggressive memes sent at 2am. With affection.", "tags": ["funny", "quirky"] },
      { "text": "Sending you 37 photos of my pet doing literally nothing.", "tags": ["sweet", "quirky"] },
      { "text": "Making Excel sheets of your favorite takeout spots.", "tags": ["nerdy", "funny"] }
    ]
  },
  {
    "question": "If you were a cocktail, what would you be?",
    "answers": [
      { "text": "A spicy margarita — salty, a little chaotic, but unforgettable.", "tags": ["flirty", "funny"] },
      { "text": "A mojito — chill, minty, and slightly chaotic in group settings.", "tags": ["quirky", "funny"] },
      { "text": "Espresso martini: wired, mysterious, and terrible at bedtime routines.", "tags": ["funny", "quirky"] }
    ]
  },
  {
    "question": "What's your go-to move when flirting?",
    "answers": [
      { "text": "I aggressively compliment your hoodie like I've never seen fabric before.", "tags": ["flirty", "sassy"] },
      { "text": "Pretend I don't like you while sending heart memes at 1am.", "tags": ["sassy", "flirty"] },
      { "text": "Use obscure sci-fi references to test compatibility.", "tags": ["nerdy", "flirty"] },
      { "text": "Smile like I know a secret… because I probably do.", "tags": ["flirty", "playful"] }
    ]
  },
  {
    "question": "If we had a secret handshake, what would it include?",
    "answers": [
      { "text": "A dramatic high-five, two finger guns, and a subtle wink.", "tags": ["playful", "flirty"] },
      { "text": "Three steps of chaos and a jazz hands finale.", "tags": ["quirky", "playful"] },
      { "text": "A synchronized Naruto run followed by pizza.", "tags": ["nerdy", "playful"] },
      { "text": "Just holding hands for an awkwardly long time.", "tags": ["wholesome", "funny"] }
    ]
  },
  {
    "question": "What's your favorite kind of romantic chaos?",
    "answers": [
      { "text": "Texting 'on my way' while still in the shower.", "tags": ["funny", "sassy"] },
      { "text": "Falling in love over a shared hatred of group chats.", "tags": ["flirty", "nerdy"] },
      { "text": "Going grocery shopping together and buying nothing on the list.", "tags": ["wholesome", "funny"] },
      { "text": "Flirting through GIFs for 3 hours straight.", "tags": ["flirty", "playful"] }
    ]
  },
  {
    "question": "What's your dream nerd date?",
    "answers": [
      { "text": "Building a LEGO Death Star while trash talking each other.", "tags": ["nerdy", "playful"] },
      { "text": "Cosplaying as background characters and crashing a Comic-Con panel.", "tags": ["nerdy", "sassy"] },
      { "text": "Co-op gaming, matching hoodies, and yelling at lag together.", "tags": ["flirty", "nerdy"] },
      { "text": "Watching documentaries and pausing every 2 minutes to comment.", "tags": ["wholesome", "nerdy"] }
    ]
  },
  {
    "question": "How do you show someone you like them?",
    "answers": [
      { "text": "Light bullying and baked goods. It's a love language.", "tags": ["sassy", "wholesome"] },
      { "text": "I make playlists like I'm scoring a film about our situationship.", "tags": ["flirty", "nerdy"] },
      { "text": "Memes. All day. Every day. You will laugh or perish.", "tags": ["playful", "funny"] },
      { "text": "Random compliments when you least expect them.", "tags": ["wholesome", "flirty"] }
    ]
  },
  {
    "question": "Which fictional couple are you most like?",
    "answers": [
      { "text": "Gomez & Morticia — dramatic, loyal, and low-key spooky.", "tags": ["flirty", "nerdy"] },
      { "text": "Han Solo and Leia — sarcastic, stubborn, inevitable.", "tags": ["sassy", "nerdy"] },
      { "text": "Jim and Pam — awkward flirtation to office legend status.", "tags": ["wholesome", "funny"] },
      { "text": "WALL-E and EVE — introvert meets laser goddess.", "tags": ["nerdy", "wholesome"] }
    ]
  },
  {
    "question": "What's your ideal lazy Sunday with a date?",
    "answers": [
      { "text": "Pancakes, cartoons, and competing over who naps first.", "tags": ["wholesome", "playful"] },
      { "text": "Wearing matching robes and roasting each other lovingly.", "tags": ["flirty", "sassy"] },
      { "text": "Slow dancing to lo-fi beats while folding laundry badly.", "tags": ["wholesome", "quirky"] },
      { "text": "Switching between Mario Kart and cuddles. Aggressive cuddles.", "tags": ["playful", "nerdy"] }
    ]
  },
  {
    "question": "Which emoji are you in a relationship?",
    "answers": [
      { "text": "🫣 — I love you, but I'm shy about it.", "tags": ["flirty", "wholesome"] },
      { "text": "🫡 — I understood the assignment. I brought snacks.", "tags": ["funny", "sassy"] },
      { "text": "👾 — Love me for my weird. Or else.", "tags": ["nerdy", "quirky"] },
      { "text": "🔥 — You're gonna get roasted and adored equally.", "tags": ["flirty", "sassy"] }
    ]
  },
  {
    "question": "What's your romantic villain origin story?",
    "answers": [
      { "text": "They said, 'I don't watch animated movies.'", "tags": ["sassy", "nerdy"] },
      { "text": "I caught feelings first. Never again.", "tags": ["funny", "flirty"] },
      { "text": "They lied about liking Star Trek. Unforgivable.", "tags": ["nerdy", "sassy"] },
      { "text": "They shared fries... and then took mine.", "tags": ["playful", "quirky"] }
    ]
  },
  {
    "question": "What's something wholesome you lowkey love?",
    "answers": [
      { "text": "Being called 'dork' by someone who means it lovingly.", "tags": ["wholesome", "flirty"] },
      { "text": "Leaving nice comments on strangers' dog pics.", "tags": ["wholesome", "playful"] },
      { "text": "Helping someone pick their snacks at the store.", "tags": ["wholesome", "funny"] },
      { "text": "Crying during animated movies. Loudly.", "tags": ["wholesome", "nerdy"] }
    ]
  },
  {
    "question": "What fictional world would you take a date to?",
    "answers": [
      { "text": "Hogwarts — but only if we're both Slytherins causing chaos.", "tags": ["nerdy", "sassy"] },
      { "text": "Middle-earth — long hikes, second breakfasts, eternal bonding.", "tags": ["wholesome", "nerdy"] },
      { "text": "Star Wars universe — nothing like trauma bonding in space.", "tags": ["flirty", "nerdy"] },
      { "text": "Animal Crossing island. Just us, a hammock, and 17,000 turnips.", "tags": ["wholesome", "quirky"] }
    ]
  },
  {
    "question": "How do you respond to 'wyd?' texts?",
    "answers": [
      { "text": "Pretending I'm not refreshing your profile again.", "tags": ["flirty", "sassy"] },
      { "text": "Trying to make pasta while philosophizing about aliens.", "tags": ["nerdy", "funny"] },
      { "text": "Building IKEA furniture while emotionally spiraling.", "tags": ["quirky", "playful"] },
      { "text": "Mentally dating you. But it's casual.", "tags": ["flirty", "funny"] }
    ]
  },
  {
    "question": "What's your idea of romantic revenge?",
    "answers": [
      { "text": "Glowing up and pretending I forgot their zodiac sign.", "tags": ["sassy", "flirty"] },
      { "text": "Blocking, unblocking, then liking one pic from 43 weeks ago.", "tags": ["sassy", "funny"] },
      { "text": "Winning them back just to cancel plans forever.", "tags": ["playful", "sassy"] },
      { "text": "Posting photos of me and my cat living our best life.", "tags": ["wholesome", "petty-cute"] }
    ]
  },
  {
    "question": "Which nerdy debate could you argue for hours?",
    "answers": [
      { "text": "Is Die Hard a Christmas movie? Yes. Fight me.", "tags": ["nerdy", "sassy"] },
      { "text": "Star Wars vs Star Trek — I bring charts.", "tags": ["nerdy", "funny"] },
      { "text": "Sub vs dub anime supremacy. I have receipts.", "tags": ["nerdy", "playful"] },
      { "text": "Why Hobbits are the real MVPs of Middle-earth.", "tags": ["nerdy", "wholesome"] }
    ]
  },
  {
    "question": "What's something low-key romantic you do?",
    "answers": [
      { "text": "I remember your coffee order. Forever.", "tags": ["wholesome", "flirty"] },
      { "text": "I'll organize your apps by emotional relevance.", "tags": ["nerdy", "funny"] },
      { "text": "I text you memes and weather updates like I'm your chaotic assistant.", "tags": ["sassy", "playful"] },
      { "text": "I'd give you the last fry. Probably.", "tags": ["wholesome", "playful"] }
    ]
  },
  {
    "question": "If love was a video game, what's your special ability?",
    "answers": [
      { "text": "Emotional damage resistance +25%", "tags": ["nerdy", "funny"] },
      { "text": "Instant eye contact crit hits (double flirt damage)", "tags": ["flirty", "nerdy"] },
      { "text": "Ability to send the perfect reaction GIF instantly.", "tags": ["playful", "sassy"] },
      { "text": "Healing aura: makes snacks and calms your anxiety.", "tags": ["wholesome", "nerdy"] }
    ]
  },
  {
    "question": "What's your chaotic good dating habit?",
    "answers": [
      { "text": "Accidentally meeting your friends before we're official.", "tags": ["playful", "funny"] },
      { "text": "Making 3 playlists for someone I've known 5 days.", "tags": ["flirty", "nerdy"] },
      { "text": "Buying gifts 'just because it reminded me of your vibe'.", "tags": ["wholesome", "flirty"] },
      { "text": "Asking deep questions mid-meme scroll.", "tags": ["quirky", "sassy"] }
    ]
  },
  {
    "question": "What would your relationship villain name be?",
    "answers": [
      { "text": "Ghostella the Flake", "tags": ["sassy", "funny"] },
      { "text": "Captain Double-Text", "tags": ["flirty", "quirky"] },
      { "text": "Professor Overshare", "tags": ["nerdy", "playful"] },
      { "text": "The Snack Thief (but cute)", "tags": ["wholesome", "funny"] }
    ]
  },
  {
    "question": "What's your vibe on a first kiss?",
    "answers": [
      { "text": "Pretend I'm chill but overanalyzing every second.", "tags": ["flirty", "introspective"] },
      { "text": "Bonus points if it's after laughing too hard.", "tags": ["wholesome", "flirty"] },
      { "text": "Cue the inner sci-fi soundtrack and slow-mo.", "tags": ["nerdy", "dramatic"] },
      { "text": "Immediately say 'That was weird' and then do it again.", "tags": ["playful", "funny"] }
    ]
  },
  {
    "question": "What's your comfort date idea?",
    "answers": [
      { "text": "PJs, takeout, and judging reality TV together.", "tags": ["wholesome", "playful"] },
      { "text": "Museums and inside jokes that spiral into flirt wars.", "tags": ["flirty", "nerdy"] },
      { "text": "Cuddling under fairy lights and pretending the world doesn't exist.", "tags": ["wholesome", "flirty"] },
      { "text": "Board games and competitive trash talk.", "tags": ["playful", "nerdy"] }
    ]
  },
  {
    "question": "How do you know you're catching feelings?",
    "answers": [
      { "text": "I save your memes in a secret folder.", "tags": ["flirty", "nerdy"] },
      { "text": "I start writing texts and deleting them because I overcare.", "tags": ["wholesome", "introspective"] },
      { "text": "I roast you… gently. With affection.", "tags": ["sassy", "flirty"] },
      { "text": "You become my home screen wallpaper. But, like, casually.", "tags": ["playful", "sweet"] }
    ]
  },
  {
    "question": "What's your weirdest dating ick?",
    "answers": [
      { "text": "People who don't like animated movies. Red flag!", "tags": ["sassy", "funny"] },
      { "text": "Lack of snack enthusiasm. It's a vibe killer.", "tags": ["quirky", "playful"] },
      { "text": "When they pronounce Mario wrong. I just can't.", "tags": ["nerdy", "funny"] },
      { "text": "Walking too confidently without knowing the directions.", "tags": ["funny", "sassy"] }
    ]
  },
  {
    "question": "What's your relationship aesthetic?",
    "answers": [
      { "text": "Power couple but chaotic neutral.", "tags": ["sassy", "flirty"] },
      { "text": "Two introverts who send memes in silence.", "tags": ["nerdy", "wholesome"] },
      { "text": "Publicly playful, privately poetic.", "tags": ["flirty", "sweet"] },
      { "text": "Mutual weirdness forever.", "tags": ["quirky", "wholesome"] }
    ]
  },
  {
    "question": "Your heart flutters when someone…",
    "answers": [
      { "text": "Matches your meme energy exactly.", "tags": ["playful", "funny"] },
      { "text": "Reads your favorite book just to understand you better.", "tags": ["wholesome", "flirty"] },
      { "text": "Touches your back in the 'you first' kind of way.", "tags": ["flirty", "romantic"] },
      { "text": "Gets excited about something nerdy with you.", "tags": ["nerdy", "sweet"] }
    ]
  },
  {
    "question": "How would your friends describe your love life?",
    "answers": [
      { "text": "Like a Shakespeare comedy with too many text receipts.", "tags": ["funny", "nerdy"] },
      { "text": "A rom-com montage, but all B-roll.", "tags": ["quirky", "funny"] },
      { "text": "Soft chaos, but with snacks.", "tags": ["wholesome", "playful"] },
      { "text": "Accidentally flirty 99% of the time.", "tags": ["flirty", "sassy"] }
    ]
  }
];