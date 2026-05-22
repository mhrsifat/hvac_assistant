import { Head, Link } from '@inertiajs/react';
import { KeyRound, Palette, User, ChevronRight } from 'lucide-react';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editPassword } from '@/routes/user-password';

const accountItems = [
  {
    title: 'Profile',
    description: 'Update your avatar, name, and contact details.',
    href: editProfile(),
    icon: User,
  },
  {
    title: 'Password',
    description: 'Change your password and keep your account secure.',
    href: editPassword(),
    icon: KeyRound,
  },
  {
    title: 'Appearance',
    description: 'Adjust the dashboard theme and interface preference.',
    href: editAppearance(),
    icon: Palette,
  },
];

export default function AccountSettings() {
  return (
    <AdminSettingsLayout title="Account settings">
      <Head title="Account settings" />

      <div className="max-w-5xl space-y-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Settings
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Account Settings
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage your profile information, password, and appearance preferences.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {accountItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>

                <h3 className="text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                  Manage
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminSettingsLayout>
  );
}
