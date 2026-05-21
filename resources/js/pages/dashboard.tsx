import { Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AdminLayout from '@/layouts/AdminLayout';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
// import { show as showTwoFactor } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';

const serverlessProducts = [
    {
        name: 'Dashboard',
        description: 'Overview of your workspace and activity',
        href: dashboard().url,
    },
    {
        name: 'Profile',
        description: 'Manage personal and account details',
        href: editProfile().url,
    },
    // {
    //     name: 'Two-factor authentication',
    //     description: 'Secure your account with 2FA',
    //     href: showTwoFactor().url,
    // },
    {
        name: 'Appearance',
        description: 'Theme and interface preferences',
        href: editAppearance().url,
    },
];

const accountProducts = [
    {
        name: 'Password',
        description: 'Update and rotate your password',
        href: editPassword().url,
    },
];

export default function Dashboard() {
    return (
        <AdminLayout title="Dashboard">
            <div className="space-y-8">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        All products
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quick access to your most-used admin resources.
                    </p>
                </div>

                <section className="space-y-3">
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl text-gray-800 dark:text-gray-100">
                                Workspace
                            </CardTitle>
                            <CardDescription>
                                Core pages for platform monitoring and setup.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="overflow-hidden rounded-b-lg border-t border-gray-200 dark:border-gray-800">
                                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                                    <thead className="bg-gray-50 text-left text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Description
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {serverlessProducts.map((item) => (
                                            <tr key={item.name}>
                                                <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-400">
                                                    <Link href={item.href}>
                                                        {item.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {item.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl text-gray-800 dark:text-gray-100">
                                Account
                            </CardTitle>
                            <CardDescription>
                                Access and identity related pages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="overflow-hidden rounded-b-lg border-t border-gray-200 dark:border-gray-800">
                                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                                    <thead className="bg-gray-50 text-left text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                Description
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {accountProducts.map((item) => (
                                            <tr key={item.name}>
                                                <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-400">
                                                    <Link href={item.href}>
                                                        {item.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {item.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AdminLayout>
    );
}
