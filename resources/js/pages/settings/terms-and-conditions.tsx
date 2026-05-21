import { Scale } from 'lucide-react';
import StaticPageEditor from './static-page-editor';

export default function TermsAndConditionsPage() {
  return (
    <StaticPageEditor
      pageTitle="Terms and Conditions"
      pageDescription="Manage the terms and conditions shown to users and visitors."
      action="/settings/terms-and-conditions"
      icon={Scale}
    />
  );
}