import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface NewsArticle {
  id: string;
  title: string;
  author?: string;
  createdAt: string;
  published: boolean;
  slug: string;
}

interface RecentNewsProps {
  articles: NewsArticle[];
}

export default function RecentNews({ articles }: RecentNewsProps) {
  const formatDate = (date: string) => {
    const now = new Date();
    const articleDate = new Date(date);
    const diffInMs = now.getTime() - articleDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return articleDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm">
      <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <a
            href="/admin/news"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            View all
          </a>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Latest news articles and updates
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {articles.length > 0 ? (
          <div className="space-y-1">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="col-span-5">Title</div>
              <div className="col-span-3">Author</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
              {articles.map((article, index) => (
                <a
                  key={article.id}
                  href={`/admin/news/edit/${article.id}`}
                  className="group grid grid-cols-12 gap-4 px-4 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200 rounded-lg"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.4s ease-out both'
                  }}
                >
                  {/* Title */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {article.title}
                      </p>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="col-span-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="truncate">{article.author || 'Unknown'}</span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>{formatDate(article.createdAt)}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-end">
                    <Badge
                      variant={article.published ? 'default' : 'secondary'}
                      className={`
                        ${article.published
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
                        }
                        font-semibold px-3 py-1 shadow-sm
                      `}
                    >
                      {article.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
              No news articles yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first article to get started
            </p>
            <a
              href="/admin/news/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
            >
              Create Article
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
