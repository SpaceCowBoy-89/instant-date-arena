-- Remove all tag-based fake communities, keeping only the 14 legitimate groups
DELETE FROM public.connections_groups 
WHERE tag_name NOT IN (
  'Book Lovers',
  'Movie Aficionados', 
  'Foodies',
  'Gamers',
  'Anime Addicts',
  'Creators',
  'Adventurers',
  'Sports Enthusiasts',
  'Collectors',
  'Tech Hobbyists',
  'Music & Performance',
  'Nature Lovers',
  'Social & Cultural'
);