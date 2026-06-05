<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\DbDumper\Databases\MariaDb;
use Spatie\DbDumper\Databases\MySql;
use Spatie\DbDumper\Databases\PostgreSql;
use ZipArchive;

class DatabaseManagerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('settings/development/db-manager');
    }

    public function download(Request $request, string $connection)
    {
        try {
            $path = $this->dumpDatabase($connection);

            return response()->download($path)->deleteFileAfterSend(true);
        } catch (Exception $e) {
            Log::error("Failed to dump database {$connection}: ".$e->getMessage());

            return back()->with('error', 'Failed to dump database: '.$e->getMessage());
        }
    }

    public function downloadAll()
    {
        try {
            $mariadbPath = $this->dumpDatabase('mariadb');
            $pgsqlPath = $this->dumpDatabase('pgsql_vector');

            $zipPath = storage_path('app/temp/all_databases_dump_'.date('Y_m_d_His').'.zip');

            // Ensure temp directory exists
            if (! File::exists(storage_path('app/temp'))) {
                File::makeDirectory(storage_path('app/temp'), 0755, true);
            }

            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                $zip->addFile($mariadbPath, 'mariadb_dump.sql');
                $zip->addFile($pgsqlPath, 'pgsql_vector_dump.sql');
                $zip->close();
            } else {
                throw new Exception('Failed to create ZIP file.');
            }

            return response()->download($zipPath)->deleteFileAfterSend(true);
        } catch (Exception $e) {
            Log::error('Failed to dump all databases: '.$e->getMessage());

            return back()->with('error', 'Failed to create zip file: '.$e->getMessage());
        } finally {
            // Cleanup individual dumps
            if (isset($mariadbPath) && File::exists($mariadbPath)) {
                File::delete($mariadbPath);
            }
            if (isset($pgsqlPath) && File::exists($pgsqlPath)) {
                File::delete($pgsqlPath);
            }
        }
    }

    public function upload(Request $request, string $connection)
    {
        $request->validate([
            'sql_file' => ['required', 'file', 'mimetypes:text/plain,application/sql,text/x-sql', 'max:512000'], // max 500MB
        ]);

        try {
            $file = $request->file('sql_file');
            $path = $file->getRealPath();

            $this->restoreDatabase($connection, $path);

            return back()->with('success', 'Database restored successfully.');
        } catch (Exception $e) {
            Log::error("Failed to restore database {$connection}: ".$e->getMessage());

            return back()->with('error', 'Failed to restore database: '.$e->getMessage());
        }
    }

    private function dumpDatabase(string $connection): string
    {
        $config = Config::get("database.connections.{$connection}");
        if (!$config) {
            throw new Exception("Database connection '{$connection}' not found.");
        }

        if (!File::exists(storage_path('app/temp'))) {
            File::makeDirectory(storage_path('app/temp'), 0755, true);
        }

        $fileName = $connection . '_dump_' . date('Y_m_d_His') . '.sql';
        $path = storage_path('app/temp/' . $fileName);

        if ($config['driver'] === 'mariadb' || $config['driver'] === 'mysql') {
            
            // Check if we are running locally on Windows
            if (app()->environment('local') && strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Find Herd's embedded MySQL dump tool automatically
                $herdPath = getenv('USERPROFILE') . '\.config\herd\bin\mysqldump.exe';
                
                if (file_exists($herdPath)) {
                    \Spatie\DbDumper\Databases\MySql::create()
                        ->setDbName($config['database'])
                        ->setUserName($config['username'])
                        ->setPassword($config['password'] ?? '')
                        ->setHost($config['host'] ?? '127.0.0.1')
                        ->setPort($config['port'] ?? 3306)
                        ->setDumpBinaryPath(dirname($herdPath)) // Force Spatie to use Herd's folder
                        ->dumpToFile($path);
                } else {
                    throw new Exception("Could not find mysqldump. Please ensure Herd is installed or add mysqldump to your Windows PATH.");
                }
            } else {
                // Production standard secure dump
                \Spatie\DbDumper\Databases\MySql::create()
                    ->setDbName($config['database'])
                    ->setUserName($config['username'])
                    ->setPassword($config['password'] ?? '')
                    ->setHost($config['host'] ?? '127.0.0.1')
                    ->setPort($config['port'] ?? 3306)
                    ->dumpToFile($path);
            }
                
        } elseif ($config['driver'] === 'pgsql') {
            // FIX 2: Check if running locally on Windows vs Production Linux
            if (app()->environment('local') && strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Securely execute dump THROUGH Docker for local Windows environment
                $user = escapeshellarg($config['username']);
                $db = escapeshellarg($config['database']);
                $escapedPath = escapeshellarg($path);

                $command = "docker exec postgres_vector_db pg_dump -U {$user} -F p {$db} > {$escapedPath}";
                exec($command);
            } else {
                // Production (CloudPanel) standard secure dump
                PostgreSql::create()
                    ->setDbName($config['database'])
                    ->setUserName($config['username'])
                    ->setPassword($config['password'] ?? '')
                    ->setHost($config['host'] ?? '127.0.0.1')
                    ->setPort($config['port'] ?? 5432)
                    ->dumpToFile($path);
            }
        } else {
            throw new Exception("Unsupported database driver '{$config['driver']}' for connection '{$connection}'.");
        }

        return $path;
    }

    private function restoreDatabase(string $connection, string $filePath): void
    {
        $config = Config::get("database.connections.{$connection}");
        if (! $config) {
            throw new Exception("Database connection '{$connection}' not found.");
        }

        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? ($config['driver'] === 'pgsql' ? 5432 : 3306);
        $db = $config['database'];
        $user = escapeshellarg($config['username']);
        $password = $config['password'] ?? '';
        $escapedFilePath = escapeshellarg($filePath);

        $output = [];
        $returnVar = 0;

        if ($config['driver'] === 'mariadb' || $config['driver'] === 'mysql') {
            $passwordParam = $password ? '-p'.escapeshellarg($password) : '';
            $command = "mysql -h {$host} -P {$port} -u {$user} {$passwordParam} {$db} < {$escapedFilePath}";
            exec($command.' 2>&1', $output, $returnVar);

        } elseif ($config['driver'] === 'pgsql') {
            if (app()->environment('local') && strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Securely execute restore THROUGH Docker for local Windows environment
                $command = "docker exec -i postgres_vector_db psql -U {$user} -d {$db} < {$escapedFilePath}";
                exec($command.' 2>&1', $output, $returnVar);
            } else {
                // Production (CloudPanel) standard secure restore
                putenv("PGPASSWORD={$password}");
                $command = "psql -h {$host} -p {$port} -U {$user} -d {$db} -f {$escapedFilePath}";
                exec($command.' 2>&1', $output, $returnVar);
                putenv('PGPASSWORD');
            }
        } else {
            throw new Exception("Unsupported database driver '{$config['driver']}' for restore.");
        }

        if ($returnVar !== 0) {
            throw new Exception('Restore command failed. Output: '.implode("\n", $output));
        }
    }
}
