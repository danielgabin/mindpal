'use client';

/**
 * Dialog for generating split files from conceptualization notes.
 * Supports 3 modes: Platform Defaults, Custom Categories, or AI-inferred.
 */

import { useState } from 'react';
import { useDefaultCategories, useGenerateSplits } from '@/hooks/use-notes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Plus, Sparkles, List, Wand2 } from 'lucide-react';

interface GenerateSplitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  onSuccess?: () => void;
}

type GenerationMode = 'defaults' | 'custom' | 'ai';

export function GenerateSplitsDialog({
  open,
  onOpenChange,
  noteId,
  onSuccess,
}: GenerateSplitsDialogProps) {
  const [mode, setMode] = useState<GenerationMode>('defaults');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');

  const { data: defaultCategories, isLoading: loadingDefaults } = useDefaultCategories();
  const generateSplits = useGenerateSplits();

  const handleAddCategory = () => {
    if (categoryInput.trim() && customCategories.length < 10) {
      setCustomCategories([...customCategories, categoryInput.trim()]);
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (index: number) => {
    setCustomCategories(customCategories.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    let categoriesToUse: string[] | undefined;

    if (mode === 'defaults') {
      categoriesToUse = defaultCategories;
    } else if (mode === 'custom') {
      categoriesToUse = customCategories.length > 0 ? customCategories : undefined;
    } else {
      // AI mode - send undefined to let backend infer
      categoriesToUse = undefined;
    }

    generateSplits.mutate(
      { noteId, categories: categoriesToUse },
      {
        onSuccess: () => {
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  const canGenerate =
    mode === 'ai' ||
    (mode === 'defaults' && defaultCategories && defaultCategories.length > 0) ||
    (mode === 'custom' && customCategories.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Split Files</DialogTitle>
          <DialogDescription>
            Automatically create organized split files from your conceptualization note
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <RadioGroup value={mode} onValueChange={(v: string) => setMode(v as GenerationMode)}>
            {/* Platform Defaults */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent transition-colors">
              <RadioGroupItem value="defaults" id="defaults" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="defaults" className="flex items-center gap-2 cursor-pointer">
                  <List className="h-4 w-4" />
                  <span className="font-semibold">Use Platform Defaults</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Use our recommended categories for clinical notes
                </p>
                {mode === 'defaults' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {loadingDefaults ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      defaultCategories?.map((cat, i) => (
                        <Badge key={i} variant="secondary">{cat}</Badge>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Categories */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent transition-colors">
              <RadioGroupItem value="custom" id="custom" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">Custom Categories</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Specify your own categories (max 10)
                </p>
                {mode === 'custom' && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter category name..."
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        disabled={customCategories.length >= 10}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddCategory}
                        disabled={!categoryInput.trim() || customCategories.length >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {customCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customCategories.map((cat, i) => (
                          <Badge key={i} variant="secondary" className="gap-1">
                            {cat}
                            <button
                              onClick={() => handleRemoveCategory(i)}
                              className="hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {customCategories.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        Add at least one category to continue
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Decide */}
            <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent transition-colors">
              <RadioGroupItem value="ai" id="ai" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="ai" className="flex items-center gap-2 cursor-pointer">
                  <Wand2 className="h-4 w-4" />
                  <span className="font-semibold">Let AI Decide</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  AI will analyze your note and suggest appropriate categories (4-7 files)
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generateSplits.isPending}
            >
              {generateSplits.isPending ? 'Generating...' : 'Generate Split Files'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
