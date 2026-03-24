import { useRef, useEffect } from 'react';
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

  // Форматирование телефона
  const formatPhone = (raw: string): string => {
    // Удаляем всё кроме цифр
    const digits = raw.replace(/\D/g, '');
    
    // Если начинается с 373, убираем её для обработки
    const localDigits = digits.startsWith('373') ? digits.slice(3) : digits;
    
    // Берём максимум 8 цифр (XX XX XX XX)
    const trimmed = localDigits.slice(0, 8);
    
    if (trimmed.length === 0) return '';
    if (trimmed.length <= 2) return `+373 (${trimmed}`;
    if (trimmed.length <= 4) return `+373 (${trimmed.slice(0, 2)}) ${trimmed.slice(2)}`;
    if (trimmed.length <= 6) return `+373 (${trimmed.slice(0, 2)}) ${trimmed.slice(2, 4)}-${trimmed.slice(4)}`;
    return `+373 (${trimmed.slice(0, 2)}) ${trimmed.slice(2, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // При нажатии Backspace в начале очищаем поле
    if (e.key === 'Backspace' && value.length <= 6) {
      onChange('');
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    // При фокусе добавляем префикс если поле пустое
    if (!value) {
      onChange('+373 (');
    }
  };

  useEffect(() => {
    // Инициализация: если значение пустое и поле в фокусе
    if (!value && inputRef.current === document.activeElement) {
      onChange('+373 (');
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="tel"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      placeholder={placeholder}
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
