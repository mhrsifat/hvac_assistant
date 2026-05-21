import { FileText } from 'lucide-react';
import StaticPageEditor from './static-page-editor';

export default function PrivacyPolicyPage() {
  return (
    <StaticPageEditor
      pageTitle="Privacy Policy"
      pageDescription="Manage the privacy policy shown to users and visitors."
      action="/settings/privacy-policy"
      icon={FileText}
    />
  );
}