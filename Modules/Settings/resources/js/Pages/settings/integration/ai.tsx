import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, Sparkles } from 'lucide-react';

type OpenAiSettings = {
  configured: boolean;
};

type OpenAiSettingsPageProps = {
  openAi: OpenAiSettings;
};

export default function Ai({ openAi }: OpenAiSettingsPageProps) {
  return (
    <AdminSettingsLayout title="AI settings">
      <Head title="AI settings" />

      <h1 className="sr-only">AI settings</h1>

      <div className="mx-auto max-w-3xl space-y-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
          <div className="hidden rounded-lg border border-zinc-200/50 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800/50 dark:bg-zinc-900 dark:text-zinc-300 sm:block">
            <Sparkles className="h-6 w-6" />
          </div>

          <div className="flex-1 space-y-2">
            <Heading
              variant="small"
              title="AI settings"
              description="Store the OpenAI API key used by your AI integrations."
            />

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {openAi.configured
                ? 'An OpenAI key is already configured. Enter a new value to replace it.'
                : 'No OpenAI key is configured yet.'}
            </p>
          </div>
        </div>

        <Form
          action="/settings/integration/ai"
          method="post"
          options={{ preserveScroll: true }}
          className="space-y-6"
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <div className="space-y-2">
                <Label htmlFor="openai_api_key">OpenAI API key</Label>
                <Input
                  id="openai_api_key"
                  name="openai_api_key"
                  type="password"
                  placeholder="sk-..."
                  className="h-11"
                  required
                />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  The value is saved to <span className="font-medium">OPENAI_API_KEY</span> in <span className="font-medium">.env</span> and config cache is cleared automatically.
                </p>
                <InputError message={errors.openai_api_key} />
              </div>

              <div className="flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                <Button disabled={processing} className="h-10 px-6 shadow-sm">
                  {processing ? 'Saving...' : 'Save AI settings'}
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
                    <CheckCircle2 className="h-4 w-4" /> OpenAI API key updated
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
