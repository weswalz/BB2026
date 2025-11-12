import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Stats {
  fightersCount: number;
  newsCount: number;
  publishedCount: number;
  draftCount: number;
  mediaCount: number;
  pagesCount: number;
}

interface DashboardStatsProps {
  stats: Stats;
}

const statConfigs = [
  {
    title: 'Fighters',
    key: 'fightersCount',
    href: '/admin/fighters',
    description: 'Active roster members',
    gradient: 'from-blue-500/10 to-blue-600/10',
    bgHover: 'hover:shadow-blue-500/20',
  },
  {
    title: 'News Articles',
    key: 'newsCount',
    href: '/admin/news',
    description: (stats: Stats) => `${stats.publishedCount} published, ${stats.draftCount} drafts`,
    gradient: 'from-emerald-500/10 to-emerald-600/10',
    bgHover: 'hover:shadow-emerald-500/20',
  },
  {
    title: 'Media Files',
    key: 'mediaCount',
    href: '/admin/media',
    description: 'Total uploaded files',
    gradient: 'from-purple-500/10 to-purple-600/10',
    bgHover: 'hover:shadow-purple-500/20',
  },
  {
    title: 'Pages',
    key: 'pagesCount',
    href: '/admin/pages',
    description: 'Managed pages',
    gradient: 'from-orange-500/10 to-orange-600/10',
    bgHover: 'hover:shadow-orange-500/20',
  },
];

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statConfigs.map((config) => {
        const value = stats[config.key as keyof Stats];
        const description = typeof config.description === 'function'
          ? config.description(stats)
          : config.description;

        return (
          <a
            key={config.key}
            href={config.href}
            className="group block transition-all duration-300"
          >
            <Card className={`
              relative overflow-hidden border-slate-200/60 dark:border-slate-700/60
              transition-all duration-300 ease-out
              hover:scale-[1.02] hover:shadow-xl ${config.bgHover}
              hover:border-slate-300/80 dark:hover:border-slate-600/80
            `}>
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                  {config.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="relative">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {value}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                  {description}
                </p>
              </CardContent>
            </Card>
          </a>
        );
      })}
    </div>
  );
}
