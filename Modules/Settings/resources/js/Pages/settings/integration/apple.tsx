import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

type AppleSettings = {
  apple_private_key_path: string;
  apple_client_id: string;
  apple_team_id: string;
  apple_key_id: string;
  appstore_password: string;
};

type AppleSettingsPageProps = {
  apple: AppleSettings;
};

export default function Apple({ apple }: AppleSettingsPageProps) {
  return (
    <AdminSettingsLayout title="Apple settings">
      <Head title="Apple settings" />

      <h1 className="sr-only">Apple settings</h1>

      <div className="mx-auto max-w-3xl space-y-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
          <div className="flex-1 space-y-2">
            <Heading
              variant="small"
              title="Apple integration"
              description="Store Apple credentials for App Store and Sign In with Apple."
            />

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Provide the path to the Apple private key and other required IDs.
            </p>
          </div>
        </div>

        <Form
          action="/settings/integration/apple"
          method="post"
          options={{ preserveScroll: true }}
          encType="multipart/form-data"
          className="space-y-6"
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <div className="space-y-2">
                <Label htmlFor="APPLE_PRIVATE_KEY_FILE">Apple private key (upload)</Label>
                <input
                  id="APPLE_PRIVATE_KEY_FILE"
                  name="APPLE_PRIVATE_KEY_FILE"
                  type="file"
                  accept=".p8,text/plain"
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-100"
                />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Upload Apple private key (.p8). Existing path: <span className="font-medium">{apple.apple_private_key_path || 'Not set'}</span></p>
                <InputError message={errors.APPLE_PRIVATE_KEY_FILE} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appstore_password">App Store password</Label>
                <Input
                  id="appstore_password"
                  name="appstore_password"
                  type="password"
                  defaultValue={apple.appstore_password}
                  placeholder="app-specific-password"
                  className="h-11"
                />
                <InputError message={errors.appstore_password} />
              </div>

              <div className="flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                <Button disabled={processing} className="h-10 px-6 shadow-sm">
                  {processing ? 'Saving...' : 'Save Apple settings'}
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
                    <CheckCircle2 className="h-4 w-4" /> Apple settings updated
                  </p>
                </Transition>
              </div>
            </>
          )}
        </Form>
      </div>
    </AdminSettingsLayout>
  );
}
