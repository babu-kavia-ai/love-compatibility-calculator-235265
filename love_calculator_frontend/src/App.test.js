import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the Love Compatibility Calculator UI", () => {
  render(<App />);

  // Title
  expect(
    screen.getByRole("heading", { name: /love compatibility calculator/i })
  ).toBeInTheDocument();

  // Primary action
  expect(
    screen.getByRole("button", { name: /calculate/i })
  ).toBeInTheDocument();

  // Inputs
  expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/second name/i)).toBeInTheDocument();
});
