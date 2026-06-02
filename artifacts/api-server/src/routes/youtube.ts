import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/youtube-multilingual", async (req, res) => {
  try {
    const { topic, level } = req.body as { topic: string; level?: string };
    const apiKey = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: "YouTube API Key not configured" });
      return;
    }

    const levelStr = level ? ` ${level} level` : "";

    const fetchLang = async (langQuery: string) => {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            maxResults: 8,
            q: `${topic}${levelStr} ${langQuery} full lecture explained tutorial`,
            type: "video",
            key: apiKey,
            videoEmbeddable: "true",
            videoSyndicated: "true",
            safeSearch: "strict",
            order: "relevance",
            videoDuration: "medium",
            videoCategoryId: "27",
          },
        },
      );
      const items = response.data.items || [];
      return items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || "",
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description || "",
      }));
    };

    const [english, hindi, nepali] = await Promise.allSettled([
      fetchLang("educational lecture study"),
      fetchLang("शिक्षा हिंदी"),
      fetchLang("शिक्षा नेपाली"),
    ]);

    res.json({
      english:
        english.status === "fulfilled" ? english.value : [],
      hindi: hindi.status === "fulfilled" ? hindi.value : [],
      nepali: nepali.status === "fulfilled" ? nepali.value : [],
    });
  } catch (e: any) {
    const reqLog = (req as any).log;
    reqLog?.error({ err: e }, "YouTube multilingual proxy error");
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
});

router.post("/youtube", async (req, res) => {
  try {
    const { query } = req.body as { query: string };
    const apiKey = process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: "YouTube API Key not configured" });
      return;
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: `${query} educational lecture study class`,
          maxResults: 25,
          type: "video",
          videoEmbeddable: "true",
          videoSyndicated: "true",
          safeSearch: "strict",
          key: apiKey,
        },
      },
    );

    const items = response.data.items || [];
    const videos = items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || "",
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description || "",
    }));
    res.json({ videos });
  } catch (e: any) {
    const reqLog = (req as any).log;
    reqLog?.error({ err: e }, "YouTube proxy error");
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
});

export default router;
