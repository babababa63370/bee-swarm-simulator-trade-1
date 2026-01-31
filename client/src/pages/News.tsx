import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Loader2, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Custom renderer for Discord-style formatting
const MarkdownComponents = {
  a: ({ node, ...props }: any) => (
    <a {...props} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" />
  ),
  u: ({ node, ...props }: any) => (
    <u {...props} className="underline" />
  ),
};

interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  author: {
    username: string;
    avatar: string;
    id: string;
  };
  attachments: any[];
  embeds: any[];
}

export default function News() {
  const channelId = "1465773678842351768";
  const { data: messages, isLoading, error } = useQuery<DiscordMessage[]>({
    queryKey: ["/api/discord/messages", channelId],
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <h2 className="text-xl font-bold text-white">Erreur de chargement</h2>
        <p className="text-muted-foreground">Impossible de récupérer les actualités.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-lg shadow-primary/5">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold font-display text-white">BSS Leaks</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover the latest leaks and news directly from our Discord server.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {messages?.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/10 overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 border-b border-white/5 bg-muted/20">
                  <img
                    src={msg.author.avatar 
                      ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
                      : `https://ui-avatars.com/api/?name=${msg.author.username}`}
                    alt={msg.author.username}
                    className="h-10 w-10 rounded-full border border-primary/20"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-sm font-bold text-white">{msg.author.username}</CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(msg.timestamp), "d MMMM yyyy 'at' HH:mm")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={MarkdownComponents}
                    >
                      {msg.content
                        .replace(/__#(.*?)__/g, '# <u>$1</u>\n')
                        .replace(/__([^ \n][\s\S]*?[^ \n])__/g, '<u>$1</u>')}
                    </ReactMarkdown>
                  </div>
                  {msg.attachments.map((at) => (
                    <div key={at.id} className="mt-4 rounded-xl overflow-hidden border border-white/10">
                      <img src={at.url} alt="attachment" className="w-full h-auto" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}