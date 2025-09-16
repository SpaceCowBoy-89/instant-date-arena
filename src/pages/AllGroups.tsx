import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Spinner from '@/components/Spinner';
import { motion } from 'framer-motion';
import { COMMUNITY_GROUPS, ICON_MAP, getIconForGroup } from '@/data/communityGroups';

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
  member_count?: number;
}

const AllGroups: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Filter communities based on search query
    if (searchQuery.trim()) {
      const filtered = communities.filter(community =>
        community.tag_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.tag_subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCommunities(filtered);
    } else {
      setFilteredCommunities(communities);
    }
  }, [searchQuery, communities]);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        navigate('/');
        return;
      }

      setUser(authUser);
      await loadCommunities(authUser.id);
    } catch (error) {
      console.error('Error checking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCommunities = async (userId: string) => {
    try {
      // Load all communities
      const { data: communitiesData } = await supabase
        .from('connections_groups')
        .select('*')
        .order('tag_name');

      if (communitiesData) {
        // Get member counts for each community
        const communitiesWithCounts = await Promise.all(
          communitiesData.map(async (community) => {
            const { count } = await supabase
              .from('user_connections_groups')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', community.id);

            return {
              ...community,
              member_count: count || 0
            };
          })
        );

        setCommunities(communitiesWithCounts);
        setFilteredCommunities(communitiesWithCounts);
      }

      // Load user's joined groups
      const { data: userGroups } = await supabase
        .from('user_connections_groups')
        .select('group_id')
        .eq('user_id', userId);

      if (userGroups) {
        setJoinedGroups(new Set(userGroups.map(ug => ug.group_id)));
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communities',
        variant: 'destructive',
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_connections_groups')
        .insert({
          user_id: user.id,
          group_id: groupId
        });

      if (error) throw error;

      setJoinedGroups(prev => new Set([...prev, groupId]));

      toast({
        title: 'Success',
        description: 'Joined community successfully!',
      });

      // Refresh member counts
      await loadCommunities(user.id);
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: 'Error',
        description: 'Failed to join community',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_connections_groups')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', groupId);

      if (error) throw error;

      setJoinedGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });

      toast({
        title: 'Success',
        description: 'Left community successfully',
      });

      // Refresh member counts
      await loadCommunities(user.id);
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave community',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <Spinner message="Loading communities..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header Banner */}
        <div className="relative mb-8 p-6 bg-gradient-to-r from-[hsl(var(--romance))]/10 to-[hsl(var(--purple-accent))]/10 rounded-3xl border border-[hsl(var(--romance))]/20 shadow-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/communities')}
              className="p-2 hover:bg-white/20 dark:hover:bg-black/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <div>
                <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">All Communities</h1>
                <p className="text-[hsl(var(--muted-foreground))] text-lg">
                  Discover and join {communities.length} amazing communities
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-3 rounded-2xl border-2 border-[hsl(var(--romance))]/20 focus:border-[hsl(var(--romance))]/40 shadow-sm"
          />
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {searchQuery ? (
              <>Showing {filteredCommunities.length} results for "{searchQuery}"</>
            ) : (
              <>Showing all {communities.length} communities</>
            )}
          </p>
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {joinedGroups.size} joined
          </Badge>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community, index) => {
            const isJoined = joinedGroups.has(community.id);
            const groupData = COMMUNITY_GROUPS[community.tag_name as keyof typeof COMMUNITY_GROUPS];
            const IconComponent = groupData ? ICON_MAP[groupData.icon as keyof typeof ICON_MAP] : Users;
            const groupColor = groupData?.color || 'bg-gray-500';

            return (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-3xl border-2 border-[hsl(var(--romance))]/10 shadow-lg overflow-hidden">
                  {/* Card Header with Icon and Title */}
                  <CardHeader className="pb-4 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--romance))]/5 to-[hsl(var(--purple-accent))]/5 dark:from-[hsl(var(--romance))]/10 dark:to-[hsl(var(--purple-accent))]/10" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Community Icon */}
                        <div className={`p-3 ${groupColor} rounded-2xl shadow-md flex items-center justify-center`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <CardTitle
                            className="text-xl cursor-pointer hover:text-[hsl(var(--romance))] transition-colors line-clamp-1 font-bold"
                            onClick={() => navigate(`/communities/${community.id}`)}
                          >
                            {community.tag_name}
                          </CardTitle>
                        </div>
                      </div>

                      {isJoined && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 border-green-200 dark:border-green-700 px-3 py-1 rounded-full"
                        >
                          ✓ Joined
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 relative">
                    {/* Description */}
                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3 mb-6 leading-relaxed">
                      {community.tag_subtitle}
                    </p>

                    {/* Member Count with Enhanced Styling */}
                    <div className="flex items-center justify-center mb-6 p-3 bg-gradient-to-r from-[hsl(var(--romance))]/5 to-[hsl(var(--purple-accent))]/5 dark:from-[hsl(var(--romance))]/10 dark:to-[hsl(var(--purple-accent))]/10 rounded-2xl border border-[hsl(var(--romance))]/10 dark:border-[hsl(var(--romance))]/20">
                      <span className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]">
                        <div className="p-2 bg-[hsl(var(--romance))]/10 dark:bg-[hsl(var(--romance))]/20 rounded-xl">
                          <Users className="h-4 w-4 text-[hsl(var(--romance))] dark:text-[hsl(var(--romance))]" />
                        </div>
                        <span>{community.member_count?.toLocaleString()} members</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[hsl(var(--romance))] dark:text-[hsl(var(--romance))] border-2 border-[hsl(var(--romance))]/30 dark:border-[hsl(var(--romance))]/40 hover:bg-[hsl(var(--romance))]/10 dark:hover:bg-[hsl(var(--romance))]/20 hover:border-[hsl(var(--romance))]/50 dark:hover:border-[hsl(var(--romance))]/60 rounded-xl font-medium"
                        onClick={() => navigate(`/communities/${community.id}`)}
                      >
                        Browse
                      </Button>
                      {isJoined ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] dark:hover:text-[hsl(var(--destructive))] hover:border-[hsl(var(--destructive))] dark:hover:border-[hsl(var(--destructive))] border-2 border-[hsl(var(--border))] dark:border-[hsl(var(--border))] rounded-xl font-medium"
                          onClick={() => handleLeaveGroup(community.id)}
                        >
                          Leave
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] dark:from-[hsl(var(--romance))] dark:to-[hsl(var(--purple-accent))] dark:hover:from-[hsl(var(--romance-dark))] dark:hover:to-[hsl(var(--purple-accent))] text-white dark:text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                          onClick={() => handleJoinGroup(community.id)}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredCommunities.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-[hsl(var(--muted))] rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No communities found</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Try adjusting your search terms or browse all communities
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </div>
        )}

        {/* Empty State */}
        {communities.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-[hsl(var(--muted))] rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No communities available</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Communities will appear here when they're created
            </p>
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default AllGroups;