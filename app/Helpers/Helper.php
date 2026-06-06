<?php

namespace App\Helpers;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Helper
{
    /**
     * Upload a file and return its path.
     *
     * @param  UploadedFile  $file
     * @param  string  $directory
     */
    public static function uploadFile($file, $directory, $prefix = 'file'): string
    {
        try {
            $imageFileName = uniqid($prefix.'_').'.'.$file->getClientOriginalExtension();
            $file->storeAs($directory, $imageFileName, 'public');

            return $directory.'/'.$imageFileName;
        } catch (Exception $e) {
            return redirect()->back()->with('t-error', 'Something went wrong');
        }
    }

    /**
     * Delete an image and return a boolean.
     *
     * @param  string  $fileUrl
     * @return bool
     */
    public static function deleteFile($fileUrl)
    {
        try {
            // Check if $fileUrl is a valid string
            if (is_string($fileUrl) && ! empty($fileUrl)) {
                // Extract the relative path from the URL
                $parsedUrl = parse_url($fileUrl);
                $relativePath = $parsedUrl['path'] ?? '';

                // Remove the leading '/storage/' from the path
                $relativePath = preg_replace('/^\/?storage\//', '', $relativePath);

                // Check if the image exists
                if (Storage::disk('public')->exists($relativePath)) {
                    // Delete the image if it exists
                    Storage::disk('public')->delete($relativePath);

                    return true;
                } else {
                    // Return false if the image does not exist
                    return false;
                }
            } else {
                // Return false if $fileUrl is not a valid string
                return false;
            }
        } catch (Exception $e) {
            // Handle any other exceptions
            return false;
        }
    }

    /**
     * Generate a unique 10-character SKU for a user based on timestamp and random string,
     * ensuring it does not already exist in the specified table.
     *
     * @param  int  $userId  The user ID for whom the SKU is generated.
     * @param  string  $tableName  The name of the table in which to check for SKU uniqueness.
     * @return string The generated SKU.
     */
    public static function generateUniqueId($table, $column, $length = 10)
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $charactersLength = strlen($characters);

        do {
            $randomString = '';
            for ($i = 0; $i < $length; $i++) {
                $randomString .= $characters[rand(0, $charactersLength - 1)];
            }
            // Check if SKU is already present in the table
            $exists = DB::table($table)->where($column, $randomString)->exists();
        } while ($exists);

        return $randomString;
    }

    // ! Generate Slug
    public static function makeSlug(string $title, $table): string
    {
        $slug = Str::slug($title);
        while (DB::table($table)->where('slug', $slug)->exists()) {
            $randomString = Str::random(5);
            $slug = Str::slug($title).'-'.$randomString;
        }

        return $slug;
    }
}
