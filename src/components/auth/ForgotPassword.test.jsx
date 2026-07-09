import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ForgotPassword from "./ForgotPassword";

const mocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
    },
  }),
}));

const renderPage = () => render(<ForgotPassword />);

describe("Forgot Password", () => {

  test("sends reset email successfully", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });

    renderPage();

    await userEvent.type(screen.getByPlaceholderText("Email"), "test@example.com");
    fireEvent.click(screen.getByRole("button", { name: /send reset email/i }));

    await waitFor(() =>
      expect(screen.getByText("Check your email for a password reset link.")).toBeInTheDocument()
    );
  });

  test("shows error if supabase fails", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    });

    renderPage();

    await userEvent.type(screen.getByPlaceholderText("Email"), "bad@example.com");
    fireEvent.click(screen.getByRole("button", { name: /send reset email/i }));

    await waitFor(() =>
      expect(screen.getByText("User not found")).toBeInTheDocument()
    );
  });

});
