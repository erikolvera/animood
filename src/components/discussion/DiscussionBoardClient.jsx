"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";

// One component serves both boards: /discussions renders it with
// animeId={null} (global) and /anime/[id]/discussions passes the id.
export default function DiscussionBoardClient({ animeId }) {
  const id = animeId;
  const isGlobal = !id;
  const supabase = createClient();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [animeTitles, setAnimeTitles] = useState({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      let query = supabase
        .from("discussion_posts")
        .select("*, profiles(username)")
        .order("created_at", { ascending: false });

      if (!isGlobal) {
        query = query.eq("anime_id", parseInt(id));
      }

      const { data, error } = await query;
      if (!error) setPosts(data || []);
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isGlobal]);

  // Fetch anime titles for global board
  useEffect(() => {
    if (!isGlobal) return;
    const ids = [...new Set(posts.map((p) => p.anime_id).filter(Boolean))];
    ids.forEach(async (animeId) => {
      if (animeTitles[animeId]) return;
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        const json = await res.json();
        setAnimeTitles((prev) => ({ ...prev, [animeId]: json.data?.title }));
      } catch {
        setAnimeTitles((prev) => ({ ...prev, [animeId]: `Anime #${animeId}` }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, isGlobal]);

  async function handleCreatePost(title, body) {
    const { error: insertError } = await supabase
      .from("discussion_posts")
      .insert({
        user_id: currentUser.id,
        anime_id: isGlobal ? null : parseInt(id),
        title: title.trim(),
        body: body.trim(),
      });

    if (insertError) {
      console.error("Insert error:", insertError.message);
      alert("Failed to post: " + insertError.message);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    let query = supabase
      .from("discussion_posts")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false });

    if (!isGlobal) {
      query = query.eq("anime_id", parseInt(id));
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("Fetch error:", fetchError.message);
      alert("Failed to fetch posts: " + fetchError.message);
      return;
    }

    setPosts(data || []);
    setShowCreateModal(false);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isGlobal ? "Global Discussion Board" : "Anime Discussion Board"}
            </h1>
            <p className="text-stone-400 text-sm mt-1">
              {isGlobal
                ? "Discussions from all animes"
                : `Discussions for this anime`}
            </p>
          </div>
          {currentUser ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-full bg-[#b6353a] text-white text-sm font-medium hover:bg-[#9e2d31] transition-colors"
            >
              Create Post
            </button>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-2 rounded-full border border-[#b6353a] text-[#b6353a] text-sm font-medium hover:bg-[#b6353a]/10 transition-colors"
            >
              Log in to post
            </Link>
          )}
        </div>

        {/* Posts */}
        {loading ? (
          <p className="text-stone-400">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg">No posts yet.</p>
            <p className="text-stone-500 text-sm mt-1">
              Be the first to start a discussion!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                animeTitle={animeTitles[post.anime_id]}
                showAnimeLabel={isGlobal}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal
          onSubmit={handleCreatePost}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
