import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YoutubeChannel, YoutubeVideo, User } from "@shared/schema";
import { LayoutGrid, Users, Youtube, Plus, Trash2, ExternalLink, RefreshCw, Loader2, Play, ChevronRight, User as UserIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Contents() {
  const { toast } = useToast();
  const [, params] = useRoute("/contents/:channelId");
  const [, setLocation] = useLocation();
  const [newChannelId, setNewChannelId] = useState("");
  
  const selectedChannelId = params?.channelId || null;
  const isIndividualPage = !!selectedChannelId;
  
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });
  
  const { data: channels, isLoading: loadingChannels } = useQuery<YoutubeChannel[]>({
    queryKey: ["/api/youtube/channels"]
  });

  const { data: videos, isLoading: loadingVideos } = useQuery<YoutubeVideo[]>({
    queryKey: ["/api/youtube/videos"]
  });

  const addChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await apiRequest("POST", "/api/youtube/channels", {
        channelId,
        title: `Channel ${channelId}`,
        thumbnail: ""
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youtube/channels"] });
      setNewChannelId("");
      toast({ title: "Channel added", description: "The YouTube channel has been added." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const removeChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await apiRequest("DELETE", `/api/youtube/channels/${channelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youtube/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/youtube/videos"] });
      if (selectedChannelId === removeChannelMutation.variables) {
        setLocation("/contents");
      }
      toast({ title: "Channel removed", description: "The channel and its videos have been removed." });
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/youtube/sync", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youtube/videos"] });
      toast({ title: "Sync completed", description: "Videos have been synchronized with YouTube." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Sync failed", description: error.message });
    }
  });

  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    if (!selectedChannelId) return videos;
    return videos.filter(v => v.channelId === selectedChannelId);
  }, [videos, selectedChannelId]);

  const selectedChannel = useMemo(() => {
    return channels?.find(c => c.channelId === selectedChannelId);
  }, [channels, selectedChannelId]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-12rem)]">
      <div className={`flex-1 space-y-6 order-2 lg:order-1 ${isIndividualPage ? "lg:col-span-full" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isIndividualPage && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/contents")}
                className="hover-elevate"
              >
                <ChevronRight className="h-6 w-6 rotate-180" />
              </Button>
            )}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Youtube className="w-8 h-8 text-red-600" /> 
                {selectedChannel ? selectedChannel.title : "Latest Content"}
              </h1>
              {selectedChannel && (
                <p className="text-muted-foreground text-sm flex items-center gap-1 cursor-pointer hover:text-primary transition-colors" onClick={() => setLocation("/contents")}>
                  Showing videos for {selectedChannel.title}. Click to show all.
                </p>
              )}
            </div>
          </div>
          {user?.isCreator && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing..." : "Sync"}
            </Button>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${isIndividualPage ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-6`}>
          {loadingVideos ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))
          ) : filteredVideos.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-muted/10 rounded-xl border-2 border-dashed">
              <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No videos found for this selection.</p>
              {selectedChannelId && (
                <Button variant="outline" size="sm" onClick={() => setLocation("/contents")}>View all videos</Button>
              )}
            </div>
          ) : (
            filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden group hover-elevate border-primary/10 bg-card/50 backdrop-blur-sm">
                <div className="relative aspect-video">
                  <img 
                    src={video.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop"} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">{new Date(video.publishedAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      {video.viewCount && <span>{Number(video.viewCount).toLocaleString()} views</span>}
                      <a 
                        href={`https://youtube.com/watch?v=${video.videoId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {!isIndividualPage && (
        <div className="w-full lg:w-80 space-y-6 order-1 lg:order-2">
          <Card className="sticky top-24 hover-elevate border-primary/20 shadow-lg bg-card/80 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                YouTubers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-3">
              <div className="space-y-1">
                <Button
                  variant={selectedChannelId === null ? "secondary" : "ghost"}
                  className={`w-full justify-between gap-2 h-11 px-3 ${selectedChannelId === null ? "bg-primary/20 text-primary font-bold" : ""}`}
                  onClick={() => setLocation("/contents")}
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span>All Content</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedChannelId === null ? "rotate-90" : ""}`} />
                </Button>

                {loadingChannels ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  channels?.map(channel => (
                    <div key={channel.id} className="group relative">
                      <Button
                        variant={selectedChannelId === channel.channelId ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 h-12 px-3 pr-10 transition-all ${
                          selectedChannelId === channel.channelId ? "bg-primary/20 text-primary font-bold border-l-4 border-l-primary rounded-l-none" : "hover:bg-primary/10"
                        }`}
                        onClick={() => setLocation(`/contents/${channel.channelId}`)}
                      >
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-muted flex items-center justify-center shrink-0">
                          {channel.thumbnail ? (
                            <img src={channel.thumbnail} alt={channel.title} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="truncate flex-1 text-left">{channel.title}</span>
                      </Button>
                      
                      {user?.isCreator && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeChannelMutation.mutate(channel.channelId);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {user?.isCreator && (
                <div className="mt-6 pt-4 border-t border-primary/10 space-y-3 px-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground px-2">Add New Channel</p>
                  <div className="flex flex-col gap-2">
                    <Input 
                      placeholder="Channel ID..." 
                      value={newChannelId}
                      onChange={(e) => setNewChannelId(e.target.value)}
                      className="h-9 text-xs border-primary/20"
                    />
                    <Button 
                      size="sm"
                      className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                      onClick={() => addChannelMutation.mutate(newChannelId)}
                      disabled={addChannelMutation.isPending || !newChannelId}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add YouTuber
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
