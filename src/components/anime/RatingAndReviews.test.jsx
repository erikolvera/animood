import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import RatingAndReviews from "./RatingAndReviews";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  maybeSingle: vi.fn(),
  range: vi.fn(),
}));

// One flexible chain covers both query shapes this component issues:
//   select().eq().eq().maybeSingle()   (refetch own rating)
//   select().eq().order().range()      (community reviews page)
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      upsert: mocks.upsert,
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: mocks.maybeSingle }),
          order: () => ({ range: mocks.range }),
        }),
      }),
    }),
  }),
}));

describe("RatingAndReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  test("shows existing user rating and review", () => {
    render(
      <RatingAndReviews
        animeId={1}
        userId="user-1"
        initialRating={{ id: 10, rating: 9, review_text: "Amazing anime." }}
      />
    );

    expect(screen.getByDisplayValue("9")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Amazing anime.")).toBeInTheDocument();
    expect(
      screen.getByText("You already rated this anime. You can update it below.")
    ).toBeInTheDocument();
  });

  test("submits a new anime rating and review", async () => {
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.maybeSingle.mockResolvedValue({
      data: { id: 99, rating: 8, review_text: "Great show." },
      error: null,
    });

    render(<RatingAndReviews animeId={1} userId="user-1" initialRating={null} />);

    expect(screen.getByText("You have not rated this anime yet.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "8" },
    });

    await userEvent.type(
      screen.getByPlaceholderText("Write your review..."),
      "Great show."
    );

    fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith(
        {
          user_id: "user-1",
          anime_id: 1,
          rating: 8,
          review_text: "Great show.",
        },
        {
          onConflict: "user_id,anime_id",
        }
      )
    );

    expect(window.alert).toHaveBeenCalledWith("Rating saved!");
  });

  test("updates an existing anime rating", async () => {
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.maybeSingle.mockResolvedValue({
      data: { id: 10, rating: 10, review_text: "Actually, I loved it." },
      error: null,
    });

    render(
      <RatingAndReviews
        animeId={1}
        userId="user-1"
        initialRating={{ id: 10, rating: 6, review_text: "It was okay." }}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "10" },
    });

    const textarea = screen.getByPlaceholderText("Write your review...");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Actually, I loved it.");

    fireEvent.click(screen.getByRole("button", { name: /update rating/i }));

    await waitFor(() => expect(mocks.upsert).toHaveBeenCalled());
    expect(window.alert).toHaveBeenCalledWith("Rating updated!");
  });

  test("blocks rating submission when logged out", () => {
    render(<RatingAndReviews animeId={1} userId={null} initialRating={null} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "8" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit rating/i }));

    expect(window.alert).toHaveBeenCalledWith("You must be logged in to rate an anime.");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  test("shows community reviews when toggled", async () => {
    mocks.range.mockResolvedValue({
      data: [
        {
          id: 1,
          user_id: "user-1",
          rating: 9,
          review_text: "Fantastic.",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          user_id: "user-2",
          rating: 7,
          review_text: "Pretty good.",
          created_at: "2024-01-02T00:00:00Z",
        },
      ],
      error: null,
    });

    render(<RatingAndReviews animeId={1} userId="user-1" initialRating={null} />);

    fireEvent.click(screen.getByRole("button", { name: /show reviews/i }));

    expect(await screen.findByText("Fantastic.")).toBeInTheDocument();
    expect(screen.getByText("Pretty good.")).toBeInTheDocument();
    expect(screen.getByText("Your review")).toBeInTheDocument();
  });
});
