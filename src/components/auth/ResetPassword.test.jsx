import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ResetPassword from "./ResetPassword";

const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  push: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: mocks.updateUser,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

const renderPage = () => render(<ResetPassword />);

describe("Reset Password", () => {

  test("mismatched passwords show error", async () => {
    renderPage();

    await userEvent.type(screen.getByPlaceholderText("New Password"), "Password1!");
    await userEvent.type(screen.getByPlaceholderText("Confirm New Password"), "wrong");

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  test("successful password update", async () => {
    mocks.updateUser.mockResolvedValue({ error: null });

    renderPage();

    await userEvent.type(screen.getByPlaceholderText("New Password"), "Password1!");
    await userEvent.type(screen.getByPlaceholderText("Confirm New Password"), "Password1!");

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(mocks.updateUser).toHaveBeenCalled()
    );
  });

});
