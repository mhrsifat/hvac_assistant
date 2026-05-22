import { Form, Head, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

type LoginPageProps = {
    system?: {
        system_name?: string | null;
    };
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const { system } = usePage<LoginPageProps>().props;
    const systemName = system?.system_name?.trim() || 'the system';

    return (
        <AuthLayout
            title="Welcome back"
            description={`Enter your credentials to access ${systemName}`}
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-6 rounded-md bg-green-50 p-4 text-sm font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-medium text-muted-foreground">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="name@example.com"
                                    className="h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="font-medium text-muted-foreground">
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="h-11 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                                <InputError message={errors.password} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="data-[state=checked]:bg-primary"
                                />
                                <Label 
                                    htmlFor="remember" 
                                    className="text-sm font-medium cursor-pointer leading-none text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Remember me
                                </Label>
                            </div>

                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                                    tabIndex={5}
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="mt-6 w-full h-11 text-base shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                            Sign In
                        </Button>

                        {canRegister && (
                            <div className="mt-8 text-center text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <TextLink 
                                    href={register()} 
                                    tabIndex={5}
                                    className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                                >
                                    Create account
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}