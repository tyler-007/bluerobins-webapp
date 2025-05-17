import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
        setInput("");
      }
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    if (input.trim()) {
      addTag(input);
      setInput("");
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 px-2 py-1 border rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 min-h-[40px]"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, idx) => (
        <span
          key={tag + idx}
          className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-200 mr-1 mb-1"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      <Input
        ref={inputRef}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="flex-1 border-none shadow-none focus:ring-0 p-0 min-w-[80px] bg-transparent"
        disabled={disabled}
        style={{ minWidth: 80 }}
      />
    </div>
  );
};
