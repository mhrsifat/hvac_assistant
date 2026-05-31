// js/pages/not-implemented/index.js
export default function NotImplemented() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
            <div className="max-w-md text-center">
                <h1 className="text-3xl font-bold">🚧 Feature Not Implemented</h1>

                <p className="mt-4 text-muted-foreground">
                    This feature is planned but has not been implemented yet.
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                    Please check back later.
                </p>
            </div>
        </div>
    );
}