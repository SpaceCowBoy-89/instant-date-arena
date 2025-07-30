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
  }
];