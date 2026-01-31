import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertSticker } from "@shared/routes";

export function useStickers(filters?: { search?: string; category?: string; trend?: string }) {
  const queryString = filters 
    ? "?" + new URLSearchParams(filters as Record<string, string>).toString() 
    : "";

  return useQuery({
    queryKey: [api.stickers.list.path, filters],
    queryFn: async () => {
      const res = await fetch(api.stickers.list.path + queryString);
      if (!res.ok) throw new Error("Failed to fetch stickers");
      return api.stickers.list.responses[200].parse(await res.json());
    },
  });
}

export function useSticker(id: number) {
  return useQuery({
    queryKey: [api.stickers.get.path, id],
    queryFn: async () => {
      // Note: We need to handle URL building manually if not using the helper in the hook
      // But for get by ID it's easier to just construct the string here or use the one from shared
      // Implementation note: The shared route definition uses :id
      const url = api.stickers.get.path.replace(":id", String(id));
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sticker");
      return api.stickers.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateSticker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSticker) => {
      const res = await fetch(api.stickers.create.path, {
        method: api.stickers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sticker");
      return api.stickers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stickers.list.path] });
    },
  });
}
