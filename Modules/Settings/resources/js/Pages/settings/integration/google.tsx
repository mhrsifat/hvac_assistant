import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, Globe } from 'lucide-react';
import { useState, useRef } from 'react';
import { ConfirmSaveDialog } from '@/components/confirm-save-dialog';

type GoogleSettings = {
  google_maps_key: string;
  google_client_id: string;
  google_client_secret: string;
  google_application_credentials: string;
};

type GoogleSettingsPageProps = {
  google: GoogleSettings;
};

export default function Google({ google }: GoogleSettingsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    setIsModalOpen(false);
    submitRef.current?.click();
  };

  return (
    <AdminSettingsLayout title="Google settings">
      <Head title="Google settings" />

      <h1 className="sr-only">Google settings</h1>

      <div className="mx-auto max-w-3xl space-y-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
          <div className="hidden rounded-lg border border-zinc-200/50 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800/50 dark:bg-zinc-900 dark:text-zinc-300 sm:block">
            <Globe className="h-6 w-6" />
          </div>

          <div className="flex-1 space-y-2">
            <Heading
              variant="small"
              title="Google settings"
              description="Store Google API keys and credentials used by integrations."
            />

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter credentials such as the Maps API key, OAuth client ID/secret, or the path to a service account JSON file.
            </p>
          </div>
        </div>

        <Form
          action="/settings/integration/google"
          method="post"
          options={{ preserveScroll: true }}
          encType="multipart/form-data"
          className="space-y-6"
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <div className="space-y-2">
                <Label htmlFor="google_play_package_name">Google Play package name</Label>
                <Input
                  id="google_play_package_name"
                  name="google_play_package_name"
                  defaultValue={google.google_play_package_name}
                  placeholder="com.example.app"
                  className="h-11"
                />
                <InputError message={errors.google_play_package_name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="GOOGLE_APPLICATION_CREDENTIALS_FILE">Service account JSON (upload)</Label>
                <input
                  id="GOOGLE_APPLICATION_CREDENTIALS_FILE"
                  name="GOOGLE_APPLICATION_CREDENTIALS_FILE"
                  type="file"
                  accept="application/json"
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-100"
                />
                {/* <p className="text-sm text-zinc-500 dark:text-zinc-400">Upload a Google service account JSON file. Existing path: <span className="font-medium">{google.google_application_credentials || 'Not set'}</span></p> */}
                <InputError message={errors.GOOGLE_APPLICATION_CREDENTIALS_FILE} />
              </div>

              <div className="flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                <button type="submit" ref={submitRef} className="hidden" />
                <Button 
                  type="button" 
                  disabled={processing} 
                  className="h-10 px-6 shadow-sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  {processing ? 'Saving...' : 'Save Google settings'}
                </Button>

                <Transition
                  show={recentlySuccessful}
                  enter="transition ease-in-out duration-300"
                  enterFrom="opacity-0 translate-x-[-10px]"
                  enterTo="opacity-100 translate-x-0"
                  leave="transition ease-in-out duration-300"
                  leaveTo="opacity-0"
                >
                  <p className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Google settings updated
                  </p>
                </Transition>
              </div>
            </>
          )}
        </Form>
      </div>

      <ConfirmSaveDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleConfirm}
      />
    </AdminSettingsLayout>
  );
}
