import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutTemplate } from 'lucide-react';
import { TemplateCard } from './template-card';
import { Template } from '@/hooks/use-templates';

interface TemplateListSectionProps {
  title: string;
  icon?: ReactNode;
  templates: Template[];
  onUse: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyState?: {
    title: string;
    description: string;
    action?: ReactNode;
  };
}

export function TemplateListSection({
  title,
  icon,
  templates,
  onUse,
  onDelete,
  emptyState,
}: TemplateListSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <Badge variant="secondary">{templates.length}</Badge>
      </CardHeader>
      <CardContent>
        {templates.length === 0 && emptyState ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-white/50 dark:bg-gray-900/50">
            <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">{emptyState.title}</h3>
            <p className="text-muted-foreground mb-4">{emptyState.description}</p>
            {emptyState.action}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={onUse}
                onDelete={onDelete}
              />
            ))}
            {templates.length === 0 && !emptyState && (
              <p className="text-muted-foreground text-sm italic">No templates available.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
