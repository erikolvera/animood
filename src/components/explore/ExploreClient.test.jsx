import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ExploreClient from "./ExploreClient";

// With react-router's MemoryRouter, clicking a genre really changed the
// in-memory URL and re-rendered. With next/navigation mocked, the URL is
// a test INPUT (mocks.searchParams) and navigation is a test OUTPUT
// (mocks.push) — so tests assert either "URL in → UI out" or
// "interaction → push out".
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(""),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => "/explore",
  useSearchParams: () => mocks.searchParams,
}));

function mockFetchResponse(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve({ data }),
  });
}

describe("ExploreClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams("");
    global.fetch = vi.fn();
    window.alert = vi.fn();
  });

  test("selecting a genre pushes it into the URL", async () => {
    fetch.mockResolvedValueOnce(mockFetchResponse([])); // initial top anime fetch
    render(<ExploreClient />);

    const actionButton = await screen.findByRole("button", { name: "Action" });
    await userEvent.click(actionButton);

    expect(mocks.push).toHaveBeenCalledWith("/explore?genres=1");
  });

  test("renders genre results for genres in the URL", async () => {
    mocks.searchParams = new URLSearchParams("genres=1");
    fetch.mockResolvedValueOnce(mockFetchResponse([
      {
        mal_id: 1,
        title: "Naruto",
        type: "TV",
        score: 8.5,
        images: { jpg: { image_url: "url" } },
      },
    ]));

    render(<ExploreClient />);

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        "https://api.jikan.moe/v4/anime?genres=1&order_by=score&sort=desc&page=1"
      );
    });

    expect(await screen.findByText(/Browsing genres: Action/i)).toBeInTheDocument();
  });

  test("selecting a second genre appends it to the URL", async () => {
    mocks.searchParams = new URLSearchParams("genres=1");
    fetch.mockResolvedValueOnce(mockFetchResponse([]));

    render(<ExploreClient />);

    const comedyButton = await screen.findByRole("button", { name: "Comedy" });
    await userEvent.click(comedyButton);

    expect(mocks.push).toHaveBeenCalledWith("/explore?genres=1,4");
  });

  test("renders results for multiple genres in the URL", async () => {
    mocks.searchParams = new URLSearchParams("genres=1,4");
    fetch.mockResolvedValueOnce(mockFetchResponse([]));

    render(<ExploreClient />);

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        "https://api.jikan.moe/v4/anime?genres=1,4&order_by=score&sort=desc&page=1"
      );
    });

    expect(
      await screen.findByText(/Browsing genres: Action, Comedy/i)
    ).toBeInTheDocument();
  });

  test("Genre results contain relevant anime", async () => {
    mocks.searchParams = new URLSearchParams("genres=1");
    fetch.mockResolvedValueOnce(mockFetchResponse([
      {
        mal_id: 10,
        title: "Attack on Titan",
        type: "TV",
        score: 9.0,
        images: { jpg: { image_url: "url" } },
      },
    ]));

    render(<ExploreClient />);

    expect(await screen.findByText("Attack on Titan")).toBeInTheDocument();
    expect(screen.getByText("★ 9")).toBeInTheDocument();
  });

  test("clearing genres pushes the bare pathname", async () => {
    mocks.searchParams = new URLSearchParams("genres=1");
    fetch.mockResolvedValueOnce(mockFetchResponse([]));

    render(<ExploreClient />);

    const clearButton = await screen.findByTitle("Clear all genres");
    await userEvent.click(clearButton);

    expect(mocks.push).toHaveBeenCalledWith("/explore");
  });

  test("shows trending anime when no genres are selected", async () => {
    fetch.mockResolvedValueOnce(mockFetchResponse([
      {
        mal_id: 99,
        title: "Fullmetal Alchemist: Brotherhood",
        type: "TV",
        score: 9.1,
        images: { jpg: { image_url: "url" } },
      },
    ]));

    render(<ExploreClient />);

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("https://api.jikan.moe/v4/top/anime")
      );
    });

    expect(await screen.findByText(/Trending anime/i)).toBeInTheDocument();
  });

  test("Invalid/unavailable genre selection", async () => {
    mocks.searchParams = new URLSearchParams("genres=999");
    fetch.mockResolvedValueOnce(mockFetchResponse([]));

    render(<ExploreClient />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "https://api.jikan.moe/v4/anime?genres=999&order_by=score&sort=desc&page=1"
      );
    });

    expect(await screen.findByText(/Browsing genres: Unknown Genre/i)).toBeInTheDocument();
  });

  test("Surprise Me button navigates correctly", async () => {
    fetch.mockResolvedValueOnce(mockFetchResponse([])); // initial top anime fetch
    render(<ExploreClient />);

    const surpriseButton = await screen.findByRole("button", { name: /Surprise Me/i });

    fetch.mockResolvedValueOnce(mockFetchResponse({
      mal_id: 777,
      title: "Steins;Gate",
      images: { jpg: { image_url: "url" } },
    }));

    await userEvent.click(surpriseButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith("https://api.jikan.moe/v4/random/anime");
      expect(mocks.push).toHaveBeenCalledWith("/anime/777");
    });
  });

  test("Surprise Me returns a valid anime each time", async () => {
    fetch.mockResolvedValueOnce(mockFetchResponse([])); // initial top anime fetch
    render(<ExploreClient />);

    const surpriseButton = await screen.findByRole("button", { name: /Surprise Me/i });

    fetch
      .mockResolvedValueOnce(mockFetchResponse({
        mal_id: 101,
        title: "Cowboy Bebop",
        images: { jpg: { image_url: "url" } },
      }))
      .mockResolvedValueOnce(mockFetchResponse({
        mal_id: 202,
        title: "Monster",
        images: { jpg: { image_url: "url" } },
      }));

    await userEvent.click(surpriseButton);
    await userEvent.click(surpriseButton);

    await waitFor(() => {
      expect(mocks.push).toHaveBeenNthCalledWith(1, "/anime/101");
      expect(mocks.push).toHaveBeenNthCalledWith(2, "/anime/202");
    });
  });

  test("Surprise Me handles API failure", async () => {
    fetch.mockResolvedValueOnce(mockFetchResponse([])); // initial top anime fetch
    render(<ExploreClient />);

    const surpriseButton = await screen.findByRole("button", { name: /Surprise Me/i });

    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    await userEvent.click(surpriseButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to fetch a random anime.");
    });

    expect(mocks.push).not.toHaveBeenCalled();
  });
});
