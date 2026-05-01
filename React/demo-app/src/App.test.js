import { render, screen } from "@testing-library/react"
import App from "./App"

test("renders demo content", () => {
  render(<App />)
  const textElement = screen.getByText(/鼠标移出/i)
  expect(textElement).toBeInTheDocument()
})
