import { NextRequest, NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();
    
    const results = await ytmusic.searchSongs(query);
    
    // Transform to a clean format for our frontend
    const songs = results.map(song => ({
      videoId: song.videoId,
      title: song.name,
      artist: song.artist.name,
      thumbnail: song.thumbnails[0]?.url || "",
      duration: song.duration,
      album: song.album?.name
    }));

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("YouTube Music search error:", error);
    return NextResponse.json({ error: "Failed to search YouTube Music" }, { status: 500 });
  }
}
