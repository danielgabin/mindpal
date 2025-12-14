'use client';

/**
 * Note editor/viewer page with markdown editing and version management.
 */

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useNote, useUpdateNote, useDeleteNote, useNoteVersions, useRestoreVersion, useSplitNotes } from '@/hooks/use-notes';
import { usePatient } from '@/hooks/use-patients';
import { GenerateSplitsDialog } from '@/components/notes/generate-splits-dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, ArrowLeft, Save, Trash, RotateCcw, Edit, Eye, Clock } from 'lucide-react';
import '@toast-ui/editor/dist/toastui-editor.css';

// Dynamic import for Toast UI Editor (client-side only)
const Editor = dynamic(() => import('@toast-ui/react-editor').then(mod => mod.Editor), { ssr: false });
const Viewer = dynamic(() => import('@toast-ui/react-editor').then(mod => mod.Viewer), { ssr: false });

export default function NoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const editorRef = useRef<any>(null);

  const { data: note, isLoading } = useNote(resolvedParams.id);
  const { data: patient } = usePatient(note?.patient_id || '');
  const { data: versions } = useNoteVersions(resolvedParams.id);
  const { data: splits } = useSplitNotes(resolvedParams.id);
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const restoreVersion = useRestoreVersion();

  const [title, setTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  // Add state to force viewer update when switching tabs or content changes
  const [previewMarkdown, setPreviewMarkdown] = useState('');

  // Update local state when note loads
  const [lastInitializedId, setLastInitializedId] = useState<string>('');

  useEffect(() => {
    if (note && note.id !== lastInitializedId) {
      setTitle(note.title);
      setPreviewMarkdown(note.content_markdown);
      setLastInitializedId(note.id);
    }
  }, [note, lastInitializedId]);

  const handleSave = useCallback(() => {
    // Get latest content from editor if active, otherwise use current state
    const markdown = editorRef.current
      ? editorRef.current.getInstance().getMarkdown()
      : previewMarkdown;

    // Update preview content on save
    setPreviewMarkdown(markdown);

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

  const onTabChange = (value: string) => {
    if (value === 'preview' && editorRef.current) {
      // Get latest content from editor when switching to preview
      setPreviewMarkdown(editorRef.current.getInstance().getMarkdown());
    }
  };

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
      <div className="border-b bg-white dark:bg-gray-900 px-8 py-6">
        <Breadcrumb className="mb-4">
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
          <div className="flex items-center gap-4">
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
            {note.kind === 'conceptualization' && (
              <>
                {splits && splits.length > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push(`/patients/${note.patient_id}#notes`);
                    }}
                  >
                    View {splits.length} Split Files
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setGenerateDialogOpen(true)}
                  >
                    Generate Split Files
                  </Button>
                )}
              </>
            )}
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
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="preview" className="space-y-6" onValueChange={onTabChange}>
            <TabsList className="w-full flex border rounded-lg bg-white p-1 h-auto">
              {[
                { value: 'preview', label: 'Preview', icon: Eye },
                { value: 'edit', label: 'Edit', icon: Edit },
                { value: 'versions', label: `Versions (${versions?.length || 0})`, icon: Clock },
              ].map((tab, index, arr) => (
                <div key={tab.value} className="flex-1 flex items-center">
                  <TabsTrigger
                    value={tab.value}
                    className="relative h-10 w-full rounded-md border-0 bg-transparent px-4 font-semibold text-muted-foreground shadow-none 
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/10 data-[state=active]:to-purple-600/10 
                    data-[state=active]:text-foreground data-[state=active]:shadow-none 
                    hover:text-foreground hover:bg-transparent transition-colors"
                  >
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                </div>
              ))}
            </TabsList>

            <TabsContent value="edit" className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 border rounded-lg overflow-hidden min-h-[600px]">
                <Editor
                  ref={editorRef}
                  initialValue={note.content_markdown}
                  previewStyle="vertical"
                  height="800px"
                  initialEditType="wysiwyg"
                  useCommandShortcut={true}
                  onChange={() => setHasUnsavedChanges(true)}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto">
              <Card>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <Viewer initialValue={previewMarkdown} key={previewMarkdown} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 overflow-y-auto">
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
                    <div className="space-y-0">
                      {versions.map((version, index) => (
                        <div key={version.id} className="grid grid-cols-[auto_auto_1fr] gap-6 relative">
                          {/* Date Column */}
                          <div className="text-right pt-9 pl-2">
                            <div className="text-sm font-medium text-foreground">
                              {new Date(version.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(version.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* Timeline Column */}
                          <div className="relative flex flex-col items-center pt-12">
                            {/* Timeline Line */}
                            {index < versions.length - 1 && (
                              <div className="absolute top-12 bottom-[-48px] w-px bg-border left-1/2 -translate-x-1/2" />
                            )}

                            {/* Timeline Circle */}
                            <div className="h-3 w-3 rounded-full border-2 border-primary bg-background z-10" />
                          </div>

                          {/* Card Column */}
                          <div className="pb-4 min-w-0">
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">Version {version.version_number}</span>
                                    {version.version_number === note.current_version && (
                                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white hover:from-blue-700 hover:to-purple-700">
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {version.version_number === 1 ? 'Initial version' : 'Modified content'}
                                  </div>
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
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  {version.version_number !== note.current_version && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedVersion(version);
                                        setRestoreConfirmOpen(true);
                                      }}
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Restore
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
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
              <div className="bg-muted p-4 rounded-lg">
                <Viewer initialValue={selectedVersion?.content_markdown} key={selectedVersion?.content_markdown} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {selectedVersion?.version_number !== note.current_version && (
                <Button onClick={() => {
                  setVersionDialogOpen(false);
                  setRestoreConfirmOpen(true);
                }}>
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

        {/* Restore Confirmation Dialog */}
        <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore Version {selectedVersion?.version_number}?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                This will overwrite the current content of the note with the content from Version {selectedVersion?.version_number}.
                This action creates a new version, so you won't lose the current state.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRestoreConfirmOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedVersion) {
                    handleRestoreVersion(selectedVersion.version_number);
                    setRestoreConfirmOpen(false);
                  }
                }}
              >
                Confirm Restore
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generate Splits Dialog */}
        {note && note.kind === 'conceptualization' && (
          <GenerateSplitsDialog
            open={generateDialogOpen}
            onOpenChange={setGenerateDialogOpen}
            noteId={resolvedParams.id}
            onSuccess={() => {
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
