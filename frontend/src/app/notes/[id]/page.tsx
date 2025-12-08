'use client';

/**
 * Note editor/viewer page with markdown editing and version management.
 */

import { use, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useNote, useUpdateNote, useDeleteNote, useNoteVersions, useRestoreVersion } from '@/hooks/use-notes';
import { usePatient } from '@/hooks/use-patients';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, ArrowLeft, Save, Trash, RotateCcw } from 'lucide-react';
import '@toast-ui/editor/dist/toastui-editor.css';

// Dynamic import for Toast UI Editor (client-side only)
const Editor = dynamic(() => import('@toast-ui/react-editor').then(mod => mod.Editor), { ssr: false });

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const editorRef = useRef<any>(null);

  const { data: note, isLoading } = useNote(resolvedParams.id);
  const { data: patient } = usePatient(note?.patient_id || '');
  const { data: versions } = useNoteVersions(resolvedParams.id);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const restoreVersion = useRestoreVersion();

  const [title, setTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  // Update local state when note loads
  useState(() => {
    if (note) {
      setTitle(note.title);
    }
  });

  const handleSave = useCallback(() => {
    if (!editorRef.current) return;

    const markdown = editorRef.current.getInstance().getMarkdown();
    updateNote.mutate(
      {
        id: resolvedParams.id,
        data: {
          title,
          content_markdown: markdown
        }
      },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
        }
      }
    );
  }, [title, resolvedParams.id, updateNote]);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote.mutate(resolvedParams.id, {
        onSuccess: () => {
          router.push(`/patients/${note?.patient_id}`);
        }
      });
    }
  };

  const handleRestoreVersion = (versionNumber: number) => {
    restoreVersion.mutate({ noteId: resolvedParams.id, versionNumber }, {
      onSuccess: () => {
        setVersionDialogOpen(false);
        // Reload editor with restored content
        window.location.reload();
      }
    });
  };

  if (isLoading || !note) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 px-8 py-4">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/patients">Patients</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/patients/${note.patient_id}`}>
                {patient?.full_name || 'Patient'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{note.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 max-w-2xl"
              placeholder="Note title"
            />
            <Badge variant="secondary" className="capitalize">{note.kind}</Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updateNote.isPending || !hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              {updateNote.isPending ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="edit" className="h-full flex flex-col">
          <div className="px-8 pt-4">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="versions">Versions ({versions?.length || 0})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit" className="flex-1 overflow-hidden mt-4 data-[state=active]:flex data-[state=active]:flex-col px-8 pb-8">
            <div className="flex-1 border rounded-lg overflow-hidden min-h-[600px]">
              <Editor
                ref={editorRef}
                initialValue={note.content_markdown}
                previewStyle="vertical"
                height="600px"
                initialEditType="wysiwyg"
                useCommandShortcut={true}
                onChange={() => setHasUnsavedChanges(true)}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 px-8 pb-8 overflow-y-auto mt-4">
            <Card>
              <CardContent className="pt-6 prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: note.content_markdown }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="flex-1 px-8 pb-8 overflow-y-auto mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                  View and restore previous versions of this note
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!versions || versions.length === 0 ? (
                  <p className="text-muted-foreground">No versions yet</p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Version {version.version_number}</span>
                            {version.version_number === note.current_version && (
                              <Badge variant="default" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(version.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVersion(version);
                              setVersionDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          {version.version_number !== note.current_version && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRestoreVersion(version.version_number)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Version View Dialog */}
      <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.version_number} - {new Date(selectedVersion?.created_at).toLocaleString()}
            </DialogTitle>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {selectedVersion?.content_markdown}
            </pre>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {selectedVersion?.version_number !== note.current_version && (
              <Button onClick={() => handleRestoreVersion(selectedVersion?.version_number)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
            )}
            <Button variant="outline" onClick={() => setVersionDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
