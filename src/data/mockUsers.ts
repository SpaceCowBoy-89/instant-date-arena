interface MockUser {
  id: string;
  name: string;
  age: number;
  photo_url: string;
  bio: string;
  interests: string[];
  groups: string[];
  location: string;
  verified: boolean;
  last_active: string;
}

interface MockPost {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  likes: number;
  comments: number;
  group_id: string;
}

// Generate realistic profile photos using placeholder services
const generateProfilePhoto = (gender: 'men' | 'women', seed: number) =>
  `https://randomuser.me/api/portraits/${gender}/${seed}.jpg`;

export const MOCK_USERS: MockUser[] = [
  // Book Lovers Community
  {
    id: 'user_001',
    name: 'Emma Thompson',
    age: 28,
    photo_url: generateProfilePhoto('women', 1),
    bio: 'Bookworm and aspiring novelist. Currently reading everything by Donna Tartt.',
    interests: ['Reading', 'Creative Writing', 'Poetry', 'Book Collecting'],
    groups: ['Book Lovers'],
    location: 'Seattle, WA',
    verified: true,
    last_active: '2024-01-15T10:30:00Z'
  },
  {
    id: 'user_002',
    name: 'Marcus Chen',
    age: 31,
    photo_url: generateProfilePhoto('men', 2),
    bio: 'Philosophy graduate turned storyteller. Love discussing plot twists over coffee.',
    interests: ['Story Writing', 'Reading', 'Storytelling'],
    groups: ['Book Lovers'],
    location: 'Portland, OR',
    verified: true,
    last_active: '2024-01-15T09:15:00Z'
  },
  {
    id: 'user_003',
    name: 'Sophie Martinez',
    age: 25,
    photo_url: generateProfilePhoto('women', 3),
    bio: 'Poetry slam enthusiast and creative writing MFA student.',
    interests: ['Poetry', 'Creative Writing', 'Writing'],
    groups: ['Book Lovers'],
    location: 'Austin, TX',
    verified: true,
    last_active: '2024-01-15T14:20:00Z'
  },

  // Movie Aficionados Community
  {
    id: 'user_004',
    name: 'Jake Rodriguez',
    age: 29,
    photo_url: generateProfilePhoto('men', 4),
    bio: 'Film student and indie filmmaker. Always looking for the next great story to tell.',
    interests: ['Filmmaking', 'Videography', 'Animation'],
    groups: ['Movie Aficionados'],
    location: 'Los Angeles, CA',
    verified: true,
    last_active: '2024-01-15T11:45:00Z'
  },
  {
    id: 'user_005',
    name: 'Zoe Kim',
    age: 26,
    photo_url: generateProfilePhoto('women', 5),
    bio: 'Animation artist and Studio Ghibli superfan. I collect movie posters from the 80s.',
    interests: ['Animation', 'Movie memorabilia collecting'],
    groups: ['Movie Aficionados'],
    location: 'San Francisco, CA',
    verified: true,
    last_active: '2024-01-15T13:10:00Z'
  },
  {
    id: 'user_006',
    name: 'David Park',
    age: 33,
    photo_url: generateProfilePhoto('men', 6),
    bio: 'Wedding videographer by day, documentary filmmaker by night.',
    interests: ['Videography', 'Filmmaking'],
    groups: ['Movie Aficionados'],
    location: 'Portland, OR',
    verified: true,
    last_active: '2024-01-15T08:30:00Z'
  },

  // Foodies Community
  {
    id: 'user_007',
    name: 'Isabella Santos',
    age: 27,
    photo_url: generateProfilePhoto('women', 7),
    bio: 'Pastry chef and sourdough enthusiast. I document my baking adventures on Instagram.',
    interests: ['Baking', 'Breadmaking', 'Cooking', 'Recipe creation'],
    groups: ['Foodies'],
    location: 'New York, NY',
    verified: true,
    last_active: '2024-01-15T12:00:00Z'
  },
  {
    id: 'user_008',
    name: 'Antonio Garcia',
    age: 35,
    photo_url: generateProfilePhoto('men', 8),
    bio: 'Home brewer and craft beer sommelier. Always experimenting with new flavors.',
    interests: ['Homebrewing', 'Beer Tasting', 'Coffee Roasting'],
    groups: ['Foodies'],
    location: 'Denver, CO',
    verified: true,
    last_active: '2024-01-15T16:45:00Z'
  },
  {
    id: 'user_009',
    name: 'Rachel Green',
    age: 24,
    photo_url: generateProfilePhoto('women', 9),
    bio: 'Culinary school graduate who loves hosting dinner parties and wine tastings.',
    interests: ['Cooking', 'Wine Tasting And Making', 'Recipe creation'],
    groups: ['Foodies'],
    location: 'Napa Valley, CA',
    verified: true,
    last_active: '2024-01-15T17:20:00Z'
  },

  // Gamers Community
  {
    id: 'user_010',
    name: 'Alex Turner',
    age: 22,
    photo_url: generateProfilePhoto('men', 10),
    bio: 'Competitive gamer and Twitch streamer. Master rank in Chess and League of Legends.',
    interests: ['Gaming', 'Esports', 'Chess', 'Video game developing'],
    groups: ['Gamers'],
    location: 'Austin, TX',
    verified: true,
    last_active: '2024-01-15T20:15:00Z'
  },
  {
    id: 'user_011',
    name: 'Maya Patel',
    age: 26,
    photo_url: generateProfilePhoto('women', 11),
    bio: 'Board game designer and D&D dungeon master. I run weekend game nights.',
    interests: ['Board Games', 'Role-playing games', 'Card Games'],
    groups: ['Gamers'],
    location: 'Seattle, WA',
    verified: true,
    last_active: '2024-01-15T19:30:00Z'
  },
  {
    id: 'user_012',
    name: 'Chris Johnson',
    age: 28,
    photo_url: generateProfilePhoto('men', 12),
    bio: 'Indie game developer and retro game collector. Working on my first indie title.',
    interests: ['Video game developing', 'Video game collecting', 'Gaming'],
    groups: ['Gamers'],
    location: 'San Francisco, CA',
    verified: true,
    last_active: '2024-01-15T18:45:00Z'
  },

  // Anime Addicts Community
  {
    id: 'user_013',
    name: 'Yuki Tanaka',
    age: 23,
    photo_url: generateProfilePhoto('women', 13),
    bio: 'Manga artist and cosplay enthusiast. Currently working on my webcomic series.',
    interests: ['Manga', 'Cosplaying', 'Animation', 'Comic Book Collecting'],
    groups: ['Anime Addicts'],
    location: 'Los Angeles, CA',
    verified: true,
    last_active: '2024-01-15T21:00:00Z'
  },
  {
    id: 'user_014',
    name: 'Tyler Brooks',
    age: 25,
    photo_url: generateProfilePhoto('men', 14),
    bio: 'Anime reviewer and convention organizer. I collect rare manga and figurines.',
    interests: ['Animation', 'Comic Book Collecting', 'Cosplaying'],
    groups: ['Anime Addicts'],
    location: 'Portland, OR',
    verified: true,
    last_active: '2024-01-15T22:15:00Z'
  },

  // Creators Community
  {
    id: 'user_015',
    name: 'Luna Rodriguez',
    age: 29,
    photo_url: generateProfilePhoto('women', 15),
    bio: 'Mixed media artist and jewelry maker. I sell my handcrafted pieces at local markets.',
    interests: ['Jewelry making', 'Painting', 'Art & Art Collecting', 'Sculpting'],
    groups: ['Creators'],
    location: 'Santa Fe, NM',
    verified: true,
    last_active: '2024-01-15T15:30:00Z'
  },
  {
    id: 'user_016',
    name: 'Oliver Smith',
    age: 32,
    photo_url: generateProfilePhoto('men', 16),
    bio: 'Woodworker and furniture designer. I create custom pieces inspired by nature.',
    interests: ['Woodworking', 'Wood carving', 'Furniture building'],
    groups: ['Creators'],
    location: 'Portland, OR',
    verified: true,
    last_active: '2024-01-15T14:45:00Z'
  },
  {
    id: 'user_017',
    name: 'Aria Wilson',
    age: 24,
    photo_url: generateProfilePhoto('women', 17),
    bio: 'Textile artist specializing in macrame and embroidery. I teach workshops on weekends.',
    interests: ['Macrame', 'Embroidery', 'Weaving', 'Craft'],
    groups: ['Creators'],
    location: 'Asheville, NC',
    verified: true,
    last_active: '2024-01-15T16:20:00Z'
  },

  // Adventurers Community
  {
    id: 'user_018',
    name: 'Ryan Mountain',
    age: 30,
    photo_url: generateProfilePhoto('men', 18),
    bio: 'Rock climbing instructor and outdoor photographer. Always planning the next adventure.',
    interests: ['Rock climbing', 'Mountaineering', 'Hiking', 'Climbing'],
    groups: ['Adventurers'],
    location: 'Boulder, CO',
    verified: true,
    last_active: '2024-01-15T07:30:00Z'
  },
  {
    id: 'user_019',
    name: 'Sage Rivers',
    age: 27,
    photo_url: generateProfilePhoto('women', 19),
    bio: 'Marine biologist and scuba diving instructor. Passionate about ocean conservation.',
    interests: ['Scuba Diving', 'Diving', 'Snorkeling', 'Travel'],
    groups: ['Adventurers'],
    location: 'San Diego, CA',
    verified: true,
    last_active: '2024-01-15T06:45:00Z'
  },
  {
    id: 'user_020',
    name: 'Cooper Trail',
    age: 33,
    photo_url: generateProfilePhoto('men', 20),
    bio: 'Thru-hiker and wilderness survival instructor. Completed the PCT and AT.',
    interests: ['Thru-hiking', 'Hiking', 'Backpacking', 'Camping'],
    groups: ['Adventurers'],
    location: 'Asheville, NC',
    verified: true,
    last_active: '2024-01-15T05:20:00Z'
  },

  // Sports Enthusiasts Community
  {
    id: 'user_021',
    name: 'Jordan Athletic',
    age: 26,
    photo_url: generateProfilePhoto('women', 21),
    bio: 'Personal trainer and yoga instructor. I compete in triathlons and love beach volleyball.',
    interests: ['Triathlon', 'Yoga', 'Beach Volleyball', 'Running'],
    groups: ['Sports Enthusiasts'],
    location: 'Miami, FL',
    verified: true,
    last_active: '2024-01-15T06:00:00Z'
  },
  {
    id: 'user_022',
    name: 'Marcus Strong',
    age: 28,
    photo_url: generateProfilePhoto('men', 22),
    bio: 'Powerlifting coach and martial arts practitioner. Black belt in Brazilian Jiu-Jitsu.',
    interests: ['Powerlifting', 'Brazilian Jiu-Jitsu', 'Martial Arts', 'Weightlifting'],
    groups: ['Sports Enthusiasts'],
    location: 'Las Vegas, NV',
    verified: true,
    last_active: '2024-01-15T07:15:00Z'
  },

  // Collectors Community
  {
    id: 'user_023',
    name: 'Victoria Vintage',
    age: 31,
    photo_url: generateProfilePhoto('women', 23),
    bio: 'Vintage clothing curator and antique collector. I love hunting for unique treasures.',
    interests: ['Vintage clothing', 'Antiquing & Artefacts', 'Vintage cars'],
    groups: ['Collectors'],
    location: 'Charleston, SC',
    verified: true,
    last_active: '2024-01-15T13:30:00Z'
  },
  {
    id: 'user_024',
    name: 'Samuel Coins',
    age: 45,
    photo_url: generateProfilePhoto('men', 24),
    bio: 'Numismatist with 20 years of experience. I specialize in rare American coins.',
    interests: ['Coin Collecting', 'Stamp collecting', 'Philately'],
    groups: ['Collectors'],
    location: 'Boston, MA',
    verified: true,
    last_active: '2024-01-15T12:45:00Z'
  },

  // Tech Hobbyists Community
  {
    id: 'user_025',
    name: 'Nova Code',
    age: 24,
    photo_url: generateProfilePhoto('women', 25),
    bio: 'Full-stack developer and robotics enthusiast. Building autonomous drones in my spare time.',
    interests: ['Coding', 'Robotics & Robot Competitions', 'Electronics'],
    groups: ['Tech Hobbyists'],
    location: 'San Francisco, CA',
    verified: true,
    last_active: '2024-01-15T23:30:00Z'
  },
  {
    id: 'user_026',
    name: 'Ethan Cipher',
    age: 29,
    photo_url: generateProfilePhoto('men', 26),
    bio: 'Cybersecurity specialist and ham radio operator. I participate in ethical hacking competitions.',
    interests: ['Hacking', 'Ham Radio', 'Cryptography'],
    groups: ['Tech Hobbyists'],
    location: 'Austin, TX',
    verified: true,
    last_active: '2024-01-15T22:45:00Z'
  },

  // Music & Performance Community
  {
    id: 'user_027',
    name: 'Melody Harper',
    age: 25,
    photo_url: generateProfilePhoto('women', 27),
    bio: 'Singer-songwriter and violin teacher. I perform at local open mic nights.',
    interests: ['Singing', 'Playing musical instruments', 'Music', 'Performance'],
    groups: ['Music & Performance'],
    location: 'Nashville, TN',
    verified: true,
    last_active: '2024-01-15T20:30:00Z'
  },
  {
    id: 'user_028',
    name: 'Rhyme Jackson',
    age: 27,
    photo_url: generateProfilePhoto('men', 28),
    bio: 'Hip-hop producer and rapper. Working on my debut album while teaching beatboxing.',
    interests: ['Rapping', 'Beatboxing', 'DJing', 'Music'],
    groups: ['Music & Performance'],
    location: 'Atlanta, GA',
    verified: true,
    last_active: '2024-01-15T21:45:00Z'
  },

  // Nature Lovers Community
  {
    id: 'user_029',
    name: 'Forest Green',
    age: 32,
    photo_url: generateProfilePhoto('women', 29),
    bio: 'Botanist and urban gardener. I maintain a rooftop garden and study native plant species.',
    interests: ['Gardening', 'Botany', 'Flower growing', 'Herbalism'],
    groups: ['Nature Lovers'],
    location: 'Portland, OR',
    verified: true,
    last_active: '2024-01-15T08:15:00Z'
  },
  {
    id: 'user_030',
    name: 'River Stone',
    age: 28,
    photo_url: generateProfilePhoto('men', 30),
    bio: 'Wildlife photographer and birdwatcher. I lead nature photography workshops.',
    interests: ['Birdwatching', 'Fossil hunting', 'Safari', 'Zoo visiting'],
    groups: ['Nature Lovers'],
    location: 'Yellowstone, MT',
    verified: true,
    last_active: '2024-01-15T07:00:00Z'
  },

  // Social & Cultural Community
  {
    id: 'user_031',
    name: 'Phoenix Drama',
    age: 26,
    photo_url: generateProfilePhoto('women', 31),
    bio: 'Theater actress and improv coach. I love Shakespeare and organizing community theater.',
    interests: ['Acting', 'Stand-up comedy', 'Public speaking', 'Teaching'],
    groups: ['Social & Cultural'],
    location: 'Chicago, IL',
    verified: true,
    last_active: '2024-01-15T19:00:00Z'
  },
  {
    id: 'user_032',
    name: 'Atlas Historian',
    age: 34,
    photo_url: generateProfilePhoto('men', 32),
    bio: 'History professor and genealogy researcher. I help people trace their family trees.',
    interests: ['Genealogy', 'Philosophy', 'Teaching', 'Volunteering'],
    groups: ['Social & Cultural'],
    location: 'Boston, MA',
    verified: true,
    last_active: '2024-01-15T11:30:00Z'
  }
];

export const MOCK_POSTS: MockPost[] = [
  // Book Lovers Posts
  {
    id: 'post_001',
    user_id: 'user_001',
    message: 'Just finished "The Secret History" and I\'m completely blown away! The way Donna Tartt weaves Greek mythology into modern college life is absolutely masterful. Who else has read this masterpiece?',
    created_at: '2024-01-15T14:30:00Z',
    likes: 23,
    comments: 8,
    group_id: 'book_lovers'
  },
  {
    id: 'post_002',
    user_id: 'user_002',
    message: 'Working on a short story about time travel, but struggling with the paradox elements. Any fellow writers have tips for handling complex sci-fi concepts without losing the human story?',
    created_at: '2024-01-15T13:15:00Z',
    likes: 15,
    comments: 12,
    group_id: 'book_lovers'
  },
  {
    id: 'post_003',
    user_id: 'user_003',
    message: 'Performing at the slam poetry night tomorrow! My piece is about urban loneliness and finding connection. Nervous but excited! 📚✨',
    created_at: '2024-01-15T16:45:00Z',
    likes: 31,
    comments: 6,
    group_id: 'book_lovers'
  },

  // Movie Aficionados Posts
  {
    id: 'post_004',
    user_id: 'user_004',
    message: 'Spent the weekend filming a short documentary about local street art. The stories these artists have are incredible. Can\'t wait to share the final cut! 🎬',
    created_at: '2024-01-15T18:20:00Z',
    likes: 28,
    comments: 9,
    group_id: 'movie_aficionados'
  },
  {
    id: 'post_005',
    user_id: 'user_005',
    message: 'Found an original "Spirited Away" poster from 2001 at a vintage shop today! My Studio Ghibli collection is finally complete. Sometimes the best treasures are hiding in plain sight 🌟',
    created_at: '2024-01-15T15:30:00Z',
    likes: 42,
    comments: 14,
    group_id: 'movie_aficionados'
  },

  // Foodies Posts
  {
    id: 'post_006',
    user_id: 'user_007',
    message: 'My sourdough starter "Doughy McDougface" just turned 6 months old! Celebrating with a batch of chocolate babka. The fermentation process never gets old 🍞',
    created_at: '2024-01-15T12:45:00Z',
    likes: 35,
    comments: 11,
    group_id: 'foodies'
  },
  {
    id: 'post_007',
    user_id: 'user_008',
    message: 'Brewed a maple bourbon porter last month and it\'s finally ready! The combination of smooth bourbon notes with rich maple is absolutely divine. Who wants to be my taste tester? 🍺',
    created_at: '2024-01-15T17:10:00Z',
    likes: 26,
    comments: 16,
    group_id: 'foodies'
  },

  // Gamers Posts
  {
    id: 'post_008',
    user_id: 'user_010',
    message: 'Finally hit Grandmaster in chess after 2 years of grinding! The journey from 1200 to 2500 rating has been incredible. Next goal: streaming some educational games 🏆',
    created_at: '2024-01-15T21:30:00Z',
    likes: 67,
    comments: 23,
    group_id: 'gamers'
  },
  {
    id: 'post_009',
    user_id: 'user_011',
    message: 'Our D&D campaign just reached level 15! After 8 months of epic adventures, my players are finally ready to face the ancient dragon. Session prep time! 🐉',
    created_at: '2024-01-15T19:45:00Z',
    likes: 41,
    comments: 18,
    group_id: 'gamers'
  },

  // Adventurers Posts
  {
    id: 'post_010',
    user_id: 'user_018',
    message: 'Conquered my first 5.12 route today at Red Rocks! The finger strength training finally paid off. Nothing beats the feeling of sending a project you\'ve been working on for months 🧗‍♂️',
    created_at: '2024-01-15T16:15:00Z',
    likes: 38,
    comments: 12,
    group_id: 'adventurers'
  },
  {
    id: 'post_011',
    user_id: 'user_019',
    message: 'Dove with hammerhead sharks in the Galápagos this week! The experience was absolutely surreal. These magnificent creatures remind me why ocean conservation is so important 🦈',
    created_at: '2024-01-15T14:20:00Z',
    likes: 52,
    comments: 20,
    group_id: 'adventurers'
  },

  // Sports Enthusiasts Posts
  {
    id: 'post_012',
    user_id: 'user_021',
    message: 'Completed my first Ironman today! 2.4 mile swim, 112 mile bike, and 26.2 mile run. My legs are jello but my heart is full. Training starts for the next one tomorrow! 💪',
    created_at: '2024-01-15T20:00:00Z',
    likes: 89,
    comments: 34,
    group_id: 'sports_enthusiasts'
  },

  // Creators Posts
  {
    id: 'post_013',
    user_id: 'user_015',
    message: 'Finished a custom engagement ring using recycled gold and ethically sourced sapphires. The couple wanted something that represented their love for the ocean 💍',
    created_at: '2024-01-15T13:00:00Z',
    likes: 44,
    comments: 15,
    group_id: 'creators'
  },

  // Tech Hobbyists Posts
  {
    id: 'post_014',
    user_id: 'user_025',
    message: 'My autonomous drone project finally achieved stable flight! 6 months of coding, 3D printing, and debugging paid off. Next challenge: obstacle avoidance 🚁',
    created_at: '2024-01-15T22:15:00Z',
    likes: 33,
    comments: 19,
    group_id: 'tech_hobbyists'
  },

  // Nature Lovers Posts
  {
    id: 'post_015',
    user_id: 'user_029',
    message: 'My rooftop garden is thriving! The native wildflower section is attracting so many beneficial insects. Urban spaces can be incredible habitats with the right approach 🌻',
    created_at: '2024-01-15T11:45:00Z',
    likes: 29,
    comments: 8,
    group_id: 'nature_lovers'
  }
];

// Helper function to get users by group
export const getUsersByGroup = (groupName: string): MockUser[] => {
  return MOCK_USERS.filter(user => user.groups.includes(groupName));
};

// Helper function to get posts by group
export const getPostsByGroup = (groupId: string): MockPost[] => {
  return MOCK_POSTS.filter(post => post.group_id === groupId);
};

// Helper function to get user by ID
export const getUserById = (userId: string): MockUser | undefined => {
  return MOCK_USERS.find(user => user.id === userId);
};

// Helper function to get random users for suggestions
export const getRandomUsers = (count: number = 5): MockUser[] => {
  const shuffled = [...MOCK_USERS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};