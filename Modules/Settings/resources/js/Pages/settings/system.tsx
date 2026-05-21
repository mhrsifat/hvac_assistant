import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';
import { Head, Form, usePage } from '@inertiajs/react';
import { Camera, Globe2, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent} from 'react';

type SystemBranding = {
  system_name?: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
};

type SystemSettingsPageProps = {
  system: SystemBranding;
};

export default function SystemSettings() {
  const { system } = usePage<SystemSettingsPageProps>().props;
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(
    system.logo_url ?? null,
  );
  const [faviconPreview, setFaviconPreview] = useState<string | null>(
    system.favicon_url ?? null,
  );
  const [logoCleared, setLogoCleared] = useState(false);
  const [faviconCleared, setFaviconCleared] = useState(false);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    setLogoCleared(false);

    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    setFaviconCleared(false);

    if (file) {
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const clearLogoSelection = () => {
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }

    setLogoPreview(null);
    setLogoCleared(true);
  };

  const clearFaviconSelection = () => {
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }

    setFaviconPreview(null);
    setFaviconCleared(true);
  };

  return (
    <AdminSettingsLayout title="System branding">
      <Head title="System branding" />

      <h1 className="sr-only">System branding</h1>

      {/* Changed to w-full and removed layout grid wrappers for full-width view */}
      <div className="w-full space-y-6">
        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
          <div className="flex items-start gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
            <div className="hidden rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:block">
              <Globe2 className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <Heading
                variant="small"
                title="System branding"
                description="Change the public-facing system name, logo, and favicon used across the app."
              />
            </div>
          </div>

          <Form
            action="/settings/system"
            method="post"
            encType="multipart/form-data"
            options={{ preserveScroll: true }}
            className="space-y-8"
          >
            {({ processing, recentlySuccessful, errors }) => (
              <>
                <div className="space-y-2">
                  <Label htmlFor="system_name">System name</Label>

                  <Input
                    id="system_name"
                    name="system_name"
                    defaultValue={system.system_name ?? ''}
                    placeholder="Smart Agro Dashboard"
                    className="h-11"
                    required
                  />

                  <InputError message={errors.system_name} />
                </div>

                <div className="grid gap-5">
                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-white p-2 text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                        <ImageIcon className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Logo
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          SVG, PNG, JPG or WEBP. Recommended for the app header.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">
                            {(system.system_name ?? 'S')
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          name="logo"
                          accept="image/*,.svg"
                          className="hidden"
                          onChange={handleLogoChange}
                        />

                        {logoCleared && (
                          <input
                            type="hidden"
                            name="remove_logo"
                            value="1"
                          />
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Choose logo
                        </Button>

                        {logoPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                            onClick={clearLogoSelection}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <InputError className="mt-3" message={errors.logo} />
                  </div>

                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-white p-2 text-zinc-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                        <Camera className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Favicon
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          ICO, PNG or SVG. This appears in the browser tab.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                        {faviconPreview ? (
                          <img
                            src={faviconPreview}
                            alt="Favicon preview"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                            {(system.system_name ?? 'S')
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={faviconInputRef}
                          type="file"
                          name="favicon"
                          accept="image/*,.ico"
                          className="hidden"
                          onChange={handleFaviconChange}
                        />

                        {faviconCleared && (
                          <input
                            type="hidden"
                            name="remove_favicon"
                            value="1"
                          />
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => faviconInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          Choose favicon
                        </Button>

                        {faviconPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                            onClick={clearFaviconSelection}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <InputError className="mt-3" message={errors.favicon} />
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                  <Button disabled={processing} className="px-6 h-10 shadow-sm">
                    {processing ? 'Saving...' : 'Save changes'}
                  </Button>

                  {recentlySuccessful && (
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Saved.
                    </p>
                  )}
                </div>
              </>
            )}
          </Form>
        </div>
      </div>
    </AdminSettingsLayout>
  );
}
