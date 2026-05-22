import type { ElementType } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ElementType
  iconBgColor?: string
  iconColorClass?: string
  subtitle?: string
  details?: string[]
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor = 'bg-[#5299ad]',
  iconColorClass = 'text-white',
  subtitle,
  details 
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-[#f5c518]/12 dark:border-[#f5c518]/10 shadow-sm dark:shadow-none rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`${iconBgColor} rounded-xl p-3 sm:p-4 flex items-center justify-center shrink-0`}>
          <Icon className={`${iconColorClass} w-6 h-6 sm:w-8 sm:h-8`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[#111111]/60 dark:text-[#F2EDE3]/65 text-[13px] sm:text-[15px] leading-snug font-normal sm:font-medium mb-1">{title}</h3>
          {subtitle && (
            <p className="text-xs text-[#111111]/45 dark:text-[#F2EDE3]/40 mb-2">{subtitle}</p>
          )}
          {details && details.length > 0 && (
            <div className="space-y-1">
              {details.map((detail, index) => (
                <p key={index} className="text-[13px] sm:text-sm font-normal text-[#111111]/75 dark:text-[#F2EDE3]/75">{detail}</p>
              ))}
            </div>
          )}
        </div>

        {!details && value && (
          <p className="text-3xl sm:text-4xl leading-none font-semibold sm:font-bold text-[#111111] dark:text-[#F2EDE3] shrink-0">{value}</p>
        )}
      </div>
    </div>
  )
}

