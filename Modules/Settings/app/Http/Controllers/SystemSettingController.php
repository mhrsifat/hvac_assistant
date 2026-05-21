<?php

namespace Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Http\Requests\SystemSettingUpdateRequest;
use Modules\Settings\Models\SystemSetting;

class SystemSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/system', [
            'system' => SystemSetting::current(),
        ]);
    }

    public function update(SystemSettingUpdateRequest $request): RedirectResponse
    {
        $systemSetting = SystemSetting::current();
        $validated = $request->validated();

        if ($request->hasFile('logo')) {
            $validated['logo'] = $this->storeReplacementFile(
                $request->file('logo'),
                $systemSetting->getRawOriginal('logo'),
                'system/logo',
            );
        } elseif ($request->boolean('remove_logo')) {
            $this->deleteStoredFile($systemSetting->getRawOriginal('logo'));
            $validated['logo'] = null;
        } else {
            unset($validated['logo']);
        }

        if ($request->hasFile('favicon')) {
            $validated['favicon'] = $this->storeReplacementFile(
                $request->file('favicon'),
                $systemSetting->getRawOriginal('favicon'),
                'system/favicon',
            );
        } elseif ($request->boolean('remove_favicon')) {
            $this->deleteStoredFile($systemSetting->getRawOriginal('favicon'));
            $validated['favicon'] = null;
        } else {
            unset($validated['favicon']);
        }

        $systemSetting->fill($validated)->save();

        Cache::forget('system_settings');

        return back()->with('success', 'System branding updated successfully.');
    }

    private function storeReplacementFile(mixed $file, ?string $existingPath, string $directory): string
    {
        $this->deleteStoredFile($existingPath);

        return $file->store($directory, 'public');
    }

    private function deleteStoredFile(?string $path): void
    {
        if (empty($path)) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
