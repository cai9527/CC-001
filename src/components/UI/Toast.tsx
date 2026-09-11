import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type ToastType } from '@/store/useToastStore';
import { classNames } from '@/utils';

const toastConfig: Record<ToastType, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-success-500" />,
    className: 'border-success-200 bg-success-50',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-danger-500" />,
    className: 'border-danger-200 bg-danger-50',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-warning-500" />,
    className: 'border-warning-200 bg-warning-50',
  },
  info: {
    icon: <Info className="w-5 h-5 text-primary-500" />,
    className: 'border-primary-200 bg-primary-50',
  },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={classNames(
              'pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg border shadow-lg min-w-72 max-w-md animate-slide-up',
              config.className
            )}
          >
            {config.icon}
            <span className="flex-1 text-sm text-neutral-800">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 hover:bg-black/5 rounded transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
