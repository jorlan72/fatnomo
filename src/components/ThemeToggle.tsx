import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect } from "react";

interface ThemeToggleProps {
  onThemeChange?: (theme: string) => void;
}

const ThemeToggle = ({ onThemeChange }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme && onThemeChange) {
      onThemeChange(theme);
    }
  }, [theme, onThemeChange]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="hover:bg-accent transition-colors"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
