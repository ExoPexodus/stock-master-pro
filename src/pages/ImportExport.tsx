import { useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { ImportJob } from '@/types';

const ImportExport = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const canImport = user?.role === 'admin' || user?.role === 'manager';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV or Excel file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await api.uploadFile<{ job_id: number; status: string }>(
        '/imports/upload',
        selectedFile
      );

      setUploadProgress(100);
      
      if (result.status === 'completed') {
        toast({
          title: 'Import completed',
          description: 'File processed successfully',
        });
      } else {
        toast({
          title: 'Import queued',
          description: 'Large file is being processed in the background',
        });
        // Poll for job status
        pollJobStatus(result.job_id);
      }

      setSelectedFile(null);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const pollJobStatus = useCallback(async (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const job = await api.get<ImportJob>(`/imports/jobs/${jobId}`);
        setCurrentJob(job);

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
          toast({
            title: job.status === 'completed' ? 'Import completed' : 'Import failed',
            description: job.status === 'completed'
              ? `Successfully processed ${job.success_count} rows`
              : job.error_details || 'Import failed',
            variant: job.status === 'failed' ? 'destructive' : 'default',
          });
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [toast]);

  const handleExport = async () => {
    try {
      const blob = await api.downloadFile('/imports/export');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: 'File downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold">Import & Export</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {canImport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    {selectedFile ? (
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          Click to select a file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CSV or Excel files only
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Uploading...
                    </p>
                  </div>
                )}

                {currentJob && currentJob.status === 'processing' && (
                  <div className="space-y-2">
                    <Progress
                      value={
                        (currentJob.processed_rows / currentJob.total_rows) * 100
                      }
                    />
                    <p className="text-sm text-center text-muted-foreground">
                      Processing: {currentJob.processed_rows} /{' '}
                      {currentJob.total_rows} rows
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Import
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Expected CSV/Excel format:</p>
                  <p>sku, name, description, unit_price, reorder_level</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download all inventory items as an Excel file for backup or
                analysis.
              </p>

              <Button className="w-full" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ImportExport;
