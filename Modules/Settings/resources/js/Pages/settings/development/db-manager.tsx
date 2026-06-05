import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ArchiveBoxIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DatabaseManager() {
  const { flash } = usePage<any>().props;
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (flash?.error) {
      setErrorMessage(flash.error);
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash?.error]);

  useEffect(() => {
    if (flash?.success) {
      setSuccessMessage(flash.success);
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [flash?.success]);

  const simulateProgress = () => {
    setProgress(10);
    const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 10 : p));
    }, 200);

    setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setProgress(0), 400);
    }, 2000);
  };

  const handleDownload = (connection: string) => {
    setDownloading(prev => ({ ...prev, [connection]: true }));
    simulateProgress();
    window.location.href = `/settings/development/db-manager/download/${connection}`;
    setTimeout(() => {
        setDownloading(prev => ({ ...prev, [connection]: false }));
    }, 2000);
  };

  const handleDownloadAll = () => {
    setDownloading(prev => ({ ...prev, 'all': true }));
    simulateProgress();
    window.location.href = `/settings/development/db-manager/download-all`;
    setTimeout(() => {
        setDownloading(prev => ({ ...prev, 'all': false }));
    }, 2000);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, connection: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    if (!confirm(`Are you sure you want to restore the ${connection} database from this file? This will overwrite existing data.`)) {
        e.target.value = '';
        return;
    }

    setUploading(prev => ({ ...prev, [connection]: true }));
    
    const formData = new FormData();
    formData.append('sql_file', file);

    router.post(`/settings/development/db-manager/upload/${connection}`, formData, {
      onSuccess: () => {
        setUploading(prev => ({ ...prev, [connection]: false }));
      },
      onError: (errors) => {
        console.error(errors);
        setUploading(prev => ({ ...prev, [connection]: false }));
      },
      onFinish: () => {
        setUploading(prev => ({ ...prev, [connection]: false }));
        e.target.value = '';
      }
    });
  };

  return (
    <AdminLayout title="Database Manager">
      <Head title="Database Manager" />
      
      {progress > 0 && (
        <div 
          className="fixed top-0 left-0 h-[3px] bg-[#4B5563] z-[9999] transition-all duration-200 ease-out" 
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="space-y-6">
        
        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-900/50 dark:border-red-800 relative">
            <button 
              onClick={() => setErrorMessage(null)} 
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div className="mt-1 text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap pr-6">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200 dark:bg-green-900/50 dark:border-green-800 relative">
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="absolute top-4 right-4 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300 pr-6">
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Database Manager
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Download database backups or restore from an SQL file.
          </p>
        </div>

        <div className="flex justify-end mb-4">
            <Button onClick={handleDownloadAll} disabled={downloading['all']} className="flex items-center gap-2">
                <ArchiveBoxIcon className="h-5 w-5" />
                Download All (ZIP)
            </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* MariaDB Card */}
          <Card className="border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle>Main Database (MariaDB)</CardTitle>
              <CardDescription>
                Contains users, models, brands, subscriptions, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex flex-wrap gap-3">
                <Button 
                    type="button" 
                    onClick={() => handleDownload('mariadb')}
                    disabled={downloading['mariadb']}
                    className="flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download .sql
                </Button>
                
                <div className="relative">
                    <Input 
                        type="file" 
                        accept=".sql,text/plain,application/sql,text/x-sql" 
                        onChange={(e) => handleUpload(e, 'mariadb')}
                        disabled={uploading['mariadb']}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button type="button" variant="secondary" disabled={uploading['mariadb']} className="flex items-center gap-2">
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        Upload & Restore .sql
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PostgreSQL Vector DB Card */}
          <Card className="border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle>Vector Database (PostgreSQL)</CardTitle>
              <CardDescription>
                Contains embeddings and vector data for AI features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex flex-wrap gap-3">
                <Button 
                    type="button" 
                    onClick={() => handleDownload('pgsql_vector')}
                    disabled={downloading['pgsql_vector']}
                    className="flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download .sql
                </Button>
                
                <div className="relative">
                    <Input 
                        type="file" 
                        accept=".sql,text/plain,application/sql,text/x-sql" 
                        onChange={(e) => handleUpload(e, 'pgsql_vector')}
                        disabled={uploading['pgsql_vector']}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button type="button" variant="secondary" disabled={uploading['pgsql_vector']} className="flex items-center gap-2">
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        Upload & Restore .sql
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
}
