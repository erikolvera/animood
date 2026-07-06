import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LoginForm from "./LoginForm";

// vi.mock factories are hoisted above imports, so shared spies must be
// created with vi.hoisted to be visible inside the factory.
const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

const renderLogin = () => render(<LoginForm />);

describe("Login Form", () => {

  test("successful login", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Email"), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "Password1!");
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() =>
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password1!",
      })
    );
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
  });

  test("empty fields show error", async () => {
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText("Both fields are required")).toBeInTheDocument();
  });

  test("invalid login shows supabase error", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Email"), "wrong@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrongpass");
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() =>
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument()
    );
  });

});
