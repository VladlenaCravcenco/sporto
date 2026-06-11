import { useRef } from 'react';
import { cn } from './ui/utils';

interface PhoneInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * PhoneInput — компонент для ввода молдавского телефона
 * Формат: +373 (XX) XX-XX-XX
 * Пример: +373 (69) 12-34-56
 */
export function PhoneInput({
  value,
  onChange,
  placeholder = '+373 (69) 12-34-56',
  className = '',
  required = false,
  disabled = false,
  ...props
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    const localDigits = digits.startsWith('373') ? digits.slice(3) : digits;
    const trimmed = localDigits.slice(0, 8);

    if (trimmed.length === 0) return '';
    if (trimmed.length <= 2) return `+373 (${trimmed}`;
    if (trimmed.length <= 4) return `+373 (${trimmed.slice(0, 2)}) ${trimmed.slice(2)}`;
    if (trimmed.length <= 6) return `+373 (${trimmed.slice(0, 2)}) ${trimmed.slice(2, 4)}-${trimmed.slice(4)}`;
    return `+373 (${trimmed.slice(0, 2)}) ${trimmed.slice(2, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cursor = e.target.selectionStart ?? e.target.value.length;
    const digitsBeforeCursor = e.target.value.slice(0, cursor).replace(/\D/g, '').replace(/^373/, '').length;
    const formatted = formatPhone(e.target.value);
    onChange(formatted);

    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input || document.activeElement !== input) return;

      let seenDigits = 0;
      let nextCursor = formatted.length;
      for (let index = 6; index < formatted.length; index += 1) {
        if (/\d/.test(formatted[index])) seenDigits += 1;
        if (seenDigits >= digitsBeforeCursor) {
          nextCursor = index + 1;
          break;
        }
      }
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (e.key !== 'Backspace' || !input || input.selectionStart !== input.selectionEnd) return;

    const cursor = input.selectionStart ?? 0;
    if (cursor > 0 && /\D/.test(value[cursor - 1] ?? '')) {
      const localDigits = value.replace(/\D/g, '').replace(/^373/, '');
      const digitsBeforeCursor = value.slice(0, cursor).replace(/\D/g, '').replace(/^373/, '').length;
      if (digitsBeforeCursor > 0) {
        const nextDigits = localDigits.slice(0, digitsBeforeCursor - 1) + localDigits.slice(digitsBeforeCursor);
        onChange(formatPhone(nextDigits));
        e.preventDefault();
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="tel"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="tel"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      required={required}
      disabled={disabled}
      {...props}
    />
  );
}
