import { useQuery, useMutation } from "@tanstack/react-query";
import { StaffMember, CommentWithAuthor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, MessageSquare, User, Save, ShieldCheck } from "lucide-react";

export default function Staff() {
  const { toast } = useToast();
  const { data: user } = useQuery({ queryKey: ["/api/auth/me"] });
  const { data: staff, isLoading } = useQuery<StaffMember[]>({ 
    queryKey: ["/api/staff"] 
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { roleLabel: string, socialLinks?: any }) => {
      const res = await apiRequest("POST", "/api/staff/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Profile updated" });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ profileId, content }: { profileId: number, content: string }) => {
      const res = await apiRequest("POST", `/api/staff/${profileId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Comment added" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-4xl font-bold font-display text-white">The Team</h1>
        <p className="text-lg text-muted-foreground">
          Meet the dedicated members who bring the Hub to life.
        </p>
      </div>

      <div className="grid gap-6">
        {staff?.map((member) => (
          <StaffCard 
            key={member.id} 
            member={member} 
            currentUser={user}
            onUpdateProfile={(data) => updateProfileMutation.mutate(data)}
            onAddComment={(content) => addCommentMutation.mutate({ profileId: member.profile?.id!, content })}
          />
        ))}
      </div>
    </div>
  );
}

function StaffCard({ member, currentUser, onUpdateProfile, onAddComment }: { 
  member: StaffMember, 
  currentUser: any,
  onUpdateProfile: (data: any) => void,
  onAddComment: (content: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [roleLabel, setRoleLabel] = useState(member.profile?.roleLabel || "");
  const [bio, setBio] = useState(member.bio || "");
  const [commentContent, setCommentContent] = useState("");
  const isOwnProfile = currentUser?.id === member.id;
  const canEdit = isOwnProfile || currentUser?.isAdmin;

  const updateBioMutation = useMutation({
    mutationFn: async (newBio: string) => {
      const res = await apiRequest("PATCH", "/api/user/bio", { bio: newBio });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });

  return (
    <Card className="overflow-hidden border-2 border-primary/10 hover:border-primary/20 transition-all bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-6 bg-muted/20 pb-6">
        <Avatar className="h-20 w-20 border-2 border-primary shadow-lg shadow-primary/20">
          <AvatarImage src={member.avatar || ""} />
          <AvatarFallback className="bg-primary/10 text-primary"><User className="h-10 w-10" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-3xl font-display text-white">{member.username}</CardTitle>
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Textarea 
                  value={roleLabel} 
                  onChange={(e) => setRoleLabel(e.target.value)}
                  placeholder="Role (e.g. Moderator)"
                  className="min-h-[40px] py-2 bg-background/50"
                />
              </div>
              <div className="flex gap-2">
                <Textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Your bio..."
                  className="min-h-[60px] py-2 bg-background/50"
                />
                <Button size="icon" className="shrink-0 self-end" onClick={() => {
                  onUpdateProfile({ roleLabel });
                  updateBioMutation.mutate(bio);
                  setIsEditing(false);
                }}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-primary font-medium text-lg">{member.profile?.roleLabel || "Staff Member"}</p>
              {member.bio && <p className="text-muted-foreground text-sm line-clamp-2">{member.bio}</p>}
            </div>
          )}
        </div>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" className="hover-elevate" onClick={() => setIsEditing(true)}>Edit</Button>
        )}
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comments
          </h3>
          
          <div className="space-y-4">
            {member.comments && member.comments.length > 0 ? (
              member.comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 text-sm bg-muted/30 p-4 rounded-xl border border-white/5">
                  <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarImage src={comment.author.avatar || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">{comment.author.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-bold text-white">{comment.author.username}</p>
                    <p className="text-muted-foreground leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground italic bg-muted/10 rounded-xl border border-dashed border-white/5">
                No comments yet.
              </p>
            )}
          </div>

          {currentUser && member.profile && (
            <div className="flex flex-col gap-3 mt-8">
              <Textarea 
                placeholder="Leave a supportive message or a question..." 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="min-h-[100px] bg-background/50 border-primary/10 focus:border-primary/30 transition-all"
              />
              <Button 
                className="self-end px-8 hover-elevate active-elevate-2"
                disabled={!commentContent.trim()}
                onClick={() => {
                  if (commentContent.trim()) {
                    onAddComment(commentContent);
                    setCommentContent("");
                  }
                }}
              >
                Post Comment
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
