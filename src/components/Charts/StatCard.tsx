import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { classNames } from '@/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

const colorMap = {
  primary: 'from-primary-500 to-primary-600',
  success: 'from-success-500 to-success-600',
  warning: 'from-warning-500 to-warning-600',
  danger: 'from-danger-500 to-danger-600',
};

export default function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  color = 'primary',
  onClick,
}: StatCardProps) {
  return (
    <div
      className={classNames(
        'card p-6 hover:shadow-lg transition-all duration-300',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-500 font-medium">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-neutral-800">{value}</span>
            {unit && <span className="text-sm text-neutral-500">{unit}</span>}
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.direction === 'up' && (
                <TrendingUp className="w-4 h-4 text-success-500" />
              )}
              {trend.direction === 'down' && (
                <TrendingDown className="w-4 h-4 text-danger-500" />
              )}
              {trend.direction === 'neutral' && (
                <Minus className="w-4 h-4 text-neutral-500" />
              )}
              <span
                className={classNames(
                  'text-sm font-medium',
                  trend.direction === 'up' && 'text-success-600',
                  trend.direction === 'down' && 'text-danger-600',
                  trend.direction === 'neutral' && 'text-neutral-600'
                )}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-neutral-500">较昨日</span>
            </div>
          )}
        </div>
        <div
          className={classNames(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-md',
            colorMap[color]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
