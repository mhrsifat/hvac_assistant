import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Camera, Trash2, Upload, CheckCircle2 } from 'lucide-react';
import type { ChangeEvent} from 'react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminSettingsLayout from '@/layouts/settings/admin-settings-layout';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarCleared, setAvatarCleared] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0];
        setAvatarCleared(false);

        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setAvatarPreview(null);
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const clearAvatarSelection = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        setAvatarPreview(null);
        setAvatarCleared(true);
    };

    return (
        <AdminSettingsLayout title="Profile settings">
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="max-w-3xl mx-auto space-y-8 p-6 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Update your account details and public profile picture."
                />

                <Form
                    {...ProfileController.update.form()}
                    encType="multipart/form-data"
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-8"
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            {/* Modern Avatar Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-900">
                                <div className="relative group mx-auto sm:mx-0 shrink-0">
                                    <div className="h-28 w-28 rounded-full ring-4 ring-zinc-100 dark:ring-zinc-900 overflow-hidden bg-zinc-50 dark:bg-zinc-900 shadow-inner transition-transform duration-300 group-hover:scale-[1.02] flex items-center justify-center">
                                        {avatarPreview || (!avatarCleared && auth.user.avatar) ? (
                                            <img
                                                src={avatarPreview ?? auth.user.avatar}
                                                alt={auth.user.name ?? 'User avatar'}
                                                className="h-full w-full object-cover object-center block"
                                            />
                                        ) : (
                                            <span className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200">
                                                {auth.user.name?.charAt(0).toUpperCase() ?? 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={triggerFileSelect}
                                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
                                        aria-label="Change avatar"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left flex-1">
                                    <Label className="text-base font-semibold">Profile Picture</Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        JPG, PNG or WEBP. Max size 2MB.
                                    </p>

                                    <input
                                        id="avatar"
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        name="avatar"
                                        onChange={handleAvatarChange}
                                    />

                                    {avatarCleared && (
                                        <input
                                            type="hidden"
                                            name="remove_avatar"
                                            value="1"
                                        />
                                    )}

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            onClick={triggerFileSelect}
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 h-9"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Upload New
                                        </Button>

                                        {(avatarPreview || (auth.user.avatar && !avatarCleared)) && (
                                            <Button
                                                type="button"
                                                onClick={clearAvatarSelection}
                                                variant="destructive"
                                                size="sm"
                                                className="gap-2 h-9 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 border-none"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Remove
                                            </Button>
                                        )}
                                    </div>

                                    <InputError
                                        className="mt-2"
                                        message={errors.avatar}
                                    />
                                </div>
                            </div>

                            {/* Form Fields Section */}
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name" className="text-sm font-medium">First name</Label>
                                    <Input
                                        id="first_name"
                                        className="h-10 focus-visible:ring-2"
                                        defaultValue={
                                            (auth.user.first_name as string | undefined) ?? ''
                                        }
                                        name="first_name"
                                        required
                                        autoComplete="given-name"
                                        placeholder="John"
                                    />
                                    <InputError message={errors.first_name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name" className="text-sm font-medium">Last name</Label>
                                    <Input
                                        id="last_name"
                                        className="h-10 focus-visible:ring-2"
                                        defaultValue={
                                            (auth.user.last_name as string | undefined) ?? ''
                                        }
                                        name="last_name"
                                        autoComplete="family-name"
                                        placeholder="Doe"
                                    />
                                    <InputError message={errors.last_name} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="h-10 focus-visible:ring-2"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="john.doe@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Verification Block */}
                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                                    <p className="text-sm text-amber-800 dark:text-amber-400">
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="font-medium underline hover:text-amber-900 dark:hover:text-amber-300 transition-colors"
                                        >
                                            Click here to resend the verification email.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4" />
                                            A new verification link has been sent to your email address.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="px-6 h-10 shadow-sm"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0 translate-x-[-10px]"
                                    enterTo="opacity-100 translate-x-0"
                                    leave="transition ease-in-out duration-300"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" /> Saved successfully
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