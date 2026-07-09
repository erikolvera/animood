import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import WatchlistToggle from "./WatchlistToggle";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  deleteFinalEq: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: mocks.insert,
      delete: () => ({
        eq: () => ({ eq: mocks.deleteFinalEq }),
      }),
    }),
  }),
}));

describe("WatchlistToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  test("adds anime to the watchlist", async () => {
    mocks.insert.mockResolvedValue({ error: null });

    render(
      <WatchlistToggle
        animeId={1}
        animeTitle="Cowboy Bebop"
        imageUrl="https://example.com/bebop.jpg"
        userId="user-1"
        initialInWatchlist={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to watchlist/i }));

    await waitFor(() =>
      expect(mocks.insert).toHaveBeenCalledWith([
        {
          user_id: "user-1",
          anime_id: 1,
          title: "Cowboy Bebop",
          image_url: "https://example.com/bebop.jpg",
        },
      ])
    );

    expect(
      screen.getByRole("button", { name: /remove from watchlist/i })
    ).toBeInTheDocument();
  });

  test("removes anime from the watchlist", async () => {
    mocks.deleteFinalEq.mockResolvedValue({ error: null });

    render(
      <WatchlistToggle
        animeId={1}
        animeTitle="Cowboy Bebop"
        imageUrl={null}
        userId="user-1"
        initialInWatchlist={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /remove from watchlist/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /add to watchlist/i })
      ).toBeInTheDocument()
    );
  });
});
