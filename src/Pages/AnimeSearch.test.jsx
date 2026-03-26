import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach, describe, test, expect } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("../services/jikanApi", () => ({
  searchAnime: vi.fn(),
}));

import { searchAnime } from "../services/jikanApi";

vi.mock("../supabaseClient", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard logout={vi.fn()} />
    </MemoryRouter>
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders anime search input", () => {
    renderDashboard();

    expect(
      screen.getByPlaceholderText("Search for an anime...")
    ).toBeInTheDocument();
  });

  test("does not search when input is empty", async () => {
    renderDashboard();

    const input = screen.getByPlaceholderText("Search for an anime...");
    fireEvent.change(input, { target: { value: "   " } });

    await vi.advanceTimersByTimeAsync(400);

    expect(searchAnime).not.toHaveBeenCalled();
  });

  test("searches for anime by name after debounce", async () => {
    searchAnime.mockResolvedValue([]);

    renderDashboard();

    const input = screen.getByPlaceholderText("Search for an anime...");
    fireEvent.change(input, { target: { value: "Naruto" } });

    expect(searchAnime).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);

    expect(searchAnime).toHaveBeenCalledWith("Naruto");
  });

  test("loads anime search results", async () => {
    searchAnime.mockResolvedValue([
      {
        mal_id: 1,
        title: "Cowboy Bebop",
        synopsis: "A space western anime.",
        score: 8.7,
        episodes: 26,
        images: {
          jpg: {
            image_url: "https://example.com/bebop.jpg",
          },
        },
      },
    ]);

    renderDashboard();

    const input = screen.getByPlaceholderText("Search for an anime...");

    fireEvent.change(input, { target: { value: "Cowboy Bebop" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(searchAnime).toHaveBeenCalledWith("Cowboy Bebop");
    expect(screen.getByText("Cowboy Bebop")).toBeInTheDocument();
    expect(screen.getByText("A space western anime.")).toBeInTheDocument();
    expect(screen.getByText("Score: 8.7")).toBeInTheDocument();
    expect(screen.getByText("Episodes: 26")).toBeInTheDocument();
  });

  test("searches by partial anime title", async () => {
    searchAnime.mockResolvedValue([
      {
        mal_id: 20,
        title: "Naruto",
        synopsis: "A young ninja strives to become Hokage.",
        score: 7.9,
        episodes: 220,
        images: {
          jpg: {
            image_url: "https://example.com/naruto.jpg",
          },
        },
      },
    ]);

    renderDashboard();

    const input = screen.getByPlaceholderText("Search for an anime...");

    fireEvent.change(input, { target: { value: "Naru" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(searchAnime).toHaveBeenCalledWith("Naru");
    expect(screen.getByText("Naruto")).toBeInTheDocument();
    expect(
      screen.getByText("A young ninja strives to become Hokage.")
    ).toBeInTheDocument();
  });

  test("shows no results for a nonexistent anime search", async () => {
    searchAnime.mockResolvedValue([]);

    renderDashboard();

    const input = screen.getByPlaceholderText("Search for an anime...");

    fireEvent.change(input, { target: { value: "asdkfjhasdlfkjh" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(searchAnime).toHaveBeenCalledWith("asdkfjhasdlfkjh");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

});