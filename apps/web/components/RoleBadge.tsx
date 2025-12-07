'use client';

import { Crown, Shield, Edit, Eye } from 'lucide-react';
import type { MemberRole } from '@/lib/permissions';

const roleConfig: Record<MemberRole, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Crown;
  description: string;
}> = {
  OWNER: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Crown,
    description: 'Full access to all features',
  },
  ADMIN: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Shield,
    description: 'Manage team and content',
  },
  EDITOR: {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: Edit,
    description: 'Create and edit content',
  },
  VIEWER: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Eye,
    description: 'View only access',
  },
};

interface RoleBadgeProps {
  role: MemberRole;
  showDescription?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RoleBadge({
  role,
  showDescription = false,
  showIcon = true,
  size = 'md',
  className = '',
}: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.VIEWER;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className={`
          inline-flex items-center gap-1.5 font-medium rounded-full border
          ${config.color} ${config.bgColor} ${config.borderColor}
          ${sizeClasses[size]}
        `}
      >
        {showIcon && <Icon className={iconSizes[size]} />}
        {role}
      </span>
      {showDescription && (
        <span className="text-xs text-gray-500 mt-0.5">
          {config.description}
        </span>
      )}
    </div>
  );
}

export function RoleBadgeInline({ role }: { role: MemberRole }) {
  const config = roleConfig[role] || roleConfig.VIEWER;
  return (
    <span className={`font-medium ${config.color}`}>
      {role}
    </span>
  );
}
