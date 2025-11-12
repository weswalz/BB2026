import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const quickActions = [
  {
    title: 'Add News',
    description: 'Create new article',
    href: '/admin/news/new',
    gradient: 'from-blue-500 to-blue-600',
    shadowColor: 'hover:shadow-blue-500/50',
  },
  {
    title: 'Add Fighter',
    description: 'Add to roster',
    href: '/admin/fighters/new',
    gradient: 'from-emerald-500 to-emerald-600',
    shadowColor: 'hover:shadow-emerald-500/50',
  },
  {
    title: 'Upload Media',
    description: 'Manage files',
    href: '/admin/media',
    gradient: 'from-purple-500 to-purple-600',
    shadowColor: 'hover:shadow-purple-500/50',
  },
  {
    title: 'Edit Pages',
    description: 'Update content',
    href: '/admin/pages',
    gradient: 'from-orange-500 to-orange-600',
    shadowColor: 'hover:shadow-orange-500/50',
  },
];

export default function QuickActions() {
  return (
    <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm">
      <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Quickly create and manage your content
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            return (
              <a
                key={action.href}
                href={action.href}
                className="group relative"
              >
                <div className={`
                  relative overflow-hidden rounded-xl p-6
                  border-2 border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-900
                  transition-all duration-300 ease-out
                  hover:border-transparent hover:scale-[1.02]
                  hover:shadow-2xl ${action.shadowColor}
                  cursor-pointer
                `}>
                  {/* Gradient Background on Hover */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${action.gradient}
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  `} />

                  <div className="relative flex flex-col items-center text-center space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-white transition-colors duration-300">
                        {action.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-white/90 transition-colors duration-300">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
