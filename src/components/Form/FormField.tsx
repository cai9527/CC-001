import { classNames } from '@/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

/** 表单字段包装：标签 + 必填标记 + 错误提示 */
export function FormField({ label, required, error, children, className, hint }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-400">{hint}</p>
      ) : null}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={classNames(
        'input',
        error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20',
        className
      )}
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect({ error, options, placeholder, className, ...props }: FormSelectProps) {
  return (
    <select
      {...props}
      className={classNames(
        'input bg-white',
        error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20',
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function FormTextArea({ error, className, ...props }: FormTextAreaProps) {
  return (
    <textarea
      {...props}
      className={classNames(
        'input resize-none',
        error && 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20',
        className
      )}
    />
  );
}
