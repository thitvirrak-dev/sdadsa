// Heritage Operations: hospitality editorial shell, navy + brass palette, Khmer-first UI, persistent operations rail.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StoreProvider } from "./lib/store";
import Home from "./pages/Home";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <StoreProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <Home />
          </TooltipProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
