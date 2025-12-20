import { useRouter } from 'next/navigation';
import { Edit, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Template } from '@/hooks/use-templates';

// Interfaces
interface TemplateCardProps {
  template: any; // Ideally strictly typed
  onUse: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TemplateCard({ template, onUse, onDelete }: TemplateCardProps) {
  const router = useRouter();

  // Strip markdown headers and special characters for preview
  const getPreview = (content: string) => {
    return content
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/[*_~`]/g, '')   // Remove formating chars
      .substring(0, 150);
  };

  const isSystem = template.is_default;

  return (
    <Card
      onClick={() => router.push(`/templates/${template.id}${!isSystem ? '?mode=edit' : ''}`)}
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 flex flex-col h-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950"
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          {isSystem ? (
            <>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Default
                </Badge>
                <div className="text-xs text-muted-foreground whitespace-nowrap font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                  System
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1">
              {/* User template title logic is mixed with actions in original, 
                    but here we can separate or keep the title dominant */}
            </div>
          )}

          {!isSystem && onDelete && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/templates/${template.id}?mode=edit`);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{template.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(template.id);
                      }}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <CardTitle className={`text-xl font-bold mt-2 group-hover:text-primary transition-colors line-clamp-2 ${!isSystem ? 'mt-0' : ''}`}>
          {template.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 font-mono text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded">
          {getPreview(template.content_markdown)}...
        </p>

        <div className="mt-auto pt-4 border-t w-full">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
            <span>Created</span>
            <span className="font-medium text-foreground">
              {new Date(template.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <Button
            variant={isSystem ? "outline" : "secondary"}
            className="w-full hover:bg-primary hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onUse(template.id);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
