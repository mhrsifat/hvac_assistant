import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, Mail } from 'lucide-react';
import { useState, useRef } from 'react';
import { ConfirmSaveDialog } from '@/components/confirm-save-dialog';

type SmtpSettings = {
  mail_mailer: string;
  mail_host: string;
  mail_port: string;
  mail_username: string;
  mail_password: string;
  mail_from_address: string;
  mail_from_name: string;
  mail_encryption: string;
};

type SmtpSettingsPageProps = {
  smtp: SmtpSettings;
};

const mailerOptions = [
  { value: 'smtp', label: 'SMTP' },
  { value: 'sendmail', label: 'Sendmail' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'SES' },
  { value: 'log', label: 'Log' },
];

const encryptionOptions = [
  { value: '', label: 'None' },
  { value: 'tls', label: 'TLS' },
  { value: 'ssl', label: 'SSL' },
];

const selectClassName =
  'h-11 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:ring-zinc-900';

export default function Smtp({ smtp }: SmtpSettingsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    setIsModalOpen(false);
    submitRef.current?.click();
  };

  return (
    <AdminSettingsLayout title="SMTP settings">
      <Head title="SMTP settings" />

      <h1 className="sr-only">SMTP settings</h1>

      <div className="mx-auto max-w-4xl space-y-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
          <div className="hidden rounded-lg border border-zinc-200/50 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800/50 dark:bg-zinc-900 dark:text-zinc-300 sm:block">
            <Mail className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <Heading
              variant="small"
              title="SMTP settings"
              description="Update the mail connection used for outgoing notifications and emails."
            />
          </div>
        </div>

        <Form
          action="/settings/integration/smtp"
          method="post"
          options={{ preserveScroll: true }}
          className="space-y-8"
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mail_mailer">Mailer</Label>
                  <select
                    id="mail_mailer"
                    name="mail_mailer"
                    defaultValue={smtp.mail_mailer}
                    className={selectClassName}
                  >
                    {mailerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <InputError message={errors.mail_mailer} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mail_host">Mail host</Label>
                  <Input
                    id="mail_host"
                    name="mail_host"
                    defaultValue={smtp.mail_host}
                    placeholder="smtp.mailtrap.io"
                    className="h-11"
                    required
                  />
                  <InputError message={errors.mail_host} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mail_port">Mail port</Label>
                  <Input
                    id="mail_port"
                    name="mail_port"
                    type="number"
                    min="1"
                    max="65535"
                    defaultValue={smtp.mail_port}
                    placeholder="587"
                    className="h-11"
                    required
                  />
                  <InputError message={errors.mail_port} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mail_username">Mail username</Label>
                  <Input
                    id="mail_username"
                    name="mail_username"
                    defaultValue={smtp.mail_username}
                    placeholder="your-username"
                    className="h-11"
                  />
                  <InputError message={errors.mail_username} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mail_password">Mail password</Label>
                  <Input
                    id="mail_password"
                    name="mail_password"
                    type="password"
                    defaultValue={smtp.mail_password}
                    placeholder="••••••••"
                    className="h-11"
                  />
                  <InputError message={errors.mail_password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mail_from_address">From address</Label>
                  <Input
                    id="mail_from_address"
                    name="mail_from_address"
                    type="email"
                    defaultValue={smtp.mail_from_address}
                    placeholder="no-reply@example.com"
                    className="h-11"
                    required
                  />
                  <InputError message={errors.mail_from_address} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mail_from_name">From name</Label>
                  <Input
                    id="mail_from_name"
                    name="mail_from_name"
                    defaultValue={smtp.mail_from_name}
                    placeholder="Acme Dashboard"
                    className="h-11"
                    required
                  />
                  <InputError message={errors.mail_from_name} />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mail_encryption">Encryption</Label>
                  <select
                    id="mail_encryption"
                    name="mail_encryption"
                    defaultValue={smtp.mail_encryption}
                    className={selectClassName}
                  >
                    {encryptionOptions.map((option) => (
                      <option key={option.value || 'none'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <InputError message={errors.mail_encryption} />
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                <button type="submit" ref={submitRef} className="hidden" />
                <Button 
                  type="button" 
                  disabled={processing} 
                  className="h-10 px-6 shadow-sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  {processing ? 'Saving...' : 'Save SMTP settings'}
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
                    <CheckCircle2 className="h-4 w-4" /> SMTP settings updated
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
