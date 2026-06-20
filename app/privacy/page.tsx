// Privacy Policy — Gitpath
// Covers GDPR (EU), CCPA (California), COPPA, PIPEDA (Canada), and general best practices.
// Last reviewed: June 2026

import Link from 'next/link';
import { Code2, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Gitpath',
  description: 'How Gitpath collects, uses, and protects your personal information.',
};

const EFFECTIVE_DATE = 'June 20, 2026';
const CONTACT_EMAIL = 'privacy@gitpath.app';
const COMPANY_NAME = 'Gitpath';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="ml-5 space-y-1.5 list-disc">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'information', label: 'Information We Collect' },
  { id: 'use', label: 'How We Use Your Information' },
  { id: 'github', label: 'GitHub & Repository Data' },
  { id: 'ai', label: 'AI Processing' },
  { id: 'sharing', label: 'Data Sharing' },
  { id: 'security', label: 'Security' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'deletion', label: 'Account Deletion' },
  { id: 'rights', label: 'Your Rights' },
  { id: 'cookies', label: 'Cookies & Tracking' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'transfers', label: 'International Transfers' },
  { id: 'changes', label: 'Policy Changes' },
  { id: 'contact', label: 'Contact Us' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl accent-gradient-bg shadow-md">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">{COMPANY_NAME}</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12 lg:flex lg:gap-12">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contents</p>
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 space-y-10">
          {/* Header */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-violet/30 bg-brand-violet/10 px-3 py-1.5 text-sm font-medium text-brand-violet">
              <Shield className="h-4 w-4" /> Privacy Policy
            </div>
            <h1 className="text-4xl font-bold tracking-tight">We take your privacy seriously</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              This Privacy Policy explains how {COMPANY_NAME} ("we", "us", or "our") collects, uses, and protects
              information about you when you use our platform.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span><strong className="text-foreground">Effective date:</strong> {EFFECTIVE_DATE}</span>
              <span><strong className="text-foreground">Applies to:</strong> gitpath.app and related services</span>
            </div>
          </div>

          <hr className="border-border" />

          {/* 1. Overview */}
          <Section id="overview" title="1. Overview">
            <p>
              {COMPANY_NAME} is an educational platform that converts GitHub repositories into interactive learning
              courses using artificial intelligence. To provide this service, we need to collect and process certain
              personal information.
            </p>
            <p>
              We are committed to protecting your personal data and complying with applicable data protection laws,
              including the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA),
              Canada's PIPEDA, and other applicable laws.
            </p>
            <p>
              <strong className="text-foreground">The short version:</strong> We only collect what we need, we never
              sell your data, and we give you full control to delete it.
            </p>
          </Section>

          {/* 2. Information We Collect */}
          <Section id="information" title="2. Information We Collect">
            <p><strong className="text-foreground">2.1 Account Information</strong></p>
            <p>When you sign in via GitHub OAuth or another provider, we receive:</p>
            <List items={[
              'Your name and display name',
              'Email address (may be the primary or public email on your account)',
              'Profile picture URL',
              'GitHub username (if you sign in via GitHub)',
              'An encrypted OAuth access token to access repositories on your behalf',
            ]} />

            <p className="pt-2"><strong className="text-foreground">2.2 Learning & Activity Data</strong></p>
            <p>As you use the platform, we store:</p>
            <List items={[
              'Repositories you import and courses generated from them',
              'Lesson progress, quiz attempts, and answers',
              'XP points, level, streak, and vibe score',
              'Concepts marked as introduced, practiced, or mastered',
              'Timestamps of learning activity',
            ]} />

            <p className="pt-2"><strong className="text-foreground">2.3 Technical & Usage Data</strong></p>
            <p>We may automatically collect:</p>
            <List items={[
              'IP address and approximate geographic location (country/region)',
              'Browser type, version, and operating system',
              'Pages visited, features used, and time spent',
              'Error logs and crash reports (via Sentry, if configured)',
              'Performance metrics (via Better Stack, if configured)',
            ]} />

            <p className="pt-2"><strong className="text-foreground">2.4 Data We Do NOT Collect</strong></p>
            <List items={[
              'Payment or financial information — Gitpath is currently free; we do not collect card numbers, bank details, or any financial data',
              'Sensitive personal data (health, race, religion, biometrics)',
              'The full contents of private repositories beyond what is needed for course generation',
              'Communications not directed to us',
            ]} />
          </Section>

          {/* 3. How We Use Your Information */}
          <Section id="use" title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <List items={[
              'Provide, operate, and improve the Gitpath platform',
              'Authenticate your account and maintain your session securely',
              'Clone and analyse repositories you explicitly import to generate AI-powered courses',
              'Track and display your learning progress, XP, level, and achievements',
              'Calculate and display leaderboard rankings',
              'Send important service communications (account changes, security notices)',
              'Detect and prevent fraud, abuse, and security incidents',
              'Comply with legal obligations',
              'Analyse aggregate usage to improve features and performance',
            ]} />
            <p className="pt-2">
              <strong className="text-foreground">Legal basis (GDPR):</strong> We process your data under the following
              lawful bases: <em>contract performance</em> (providing the service you signed up for),
              <em> legitimate interests</em> (security, fraud prevention, product improvement),
              <em> legal obligation</em> (compliance with applicable laws), and <em>consent</em> where explicitly obtained.
            </p>
          </Section>

          {/* 4. GitHub & Repository Data */}
          <Section id="github" title="4. GitHub & Repository Data">
            <p>
              When you import a repository, {COMPANY_NAME} temporarily clones the repository to a secure server for
              static analysis and AI course generation. This is the most sensitive part of our data processing, and
              we handle it carefully:
            </p>
            <List items={[
              'We only clone repositories that you explicitly submit via the import form',
              'The local clone is deleted from our servers immediately after course generation completes — whether generation succeeds or fails. Only the generated course content (lessons, quizzes) is kept in the database.',
              'For private repositories, we use your encrypted GitHub OAuth token stored in our database using AES-256-GCM encryption',
              'We do not share repository contents with any third party except the AI model provider you configure (e.g., Google AI Studio, or your own self-hosted model)',
              'Generated course content is stored in our database and remains publicly accessible as educational material, even after you delete your account',
              'You can delete your account and all personal data at any time — see Section 9 for details',
            ]} />
            <p>
              <strong className="text-foreground">Compliance with GitHub Terms of Service:</strong> You must only import
              repositories for which you have the right to authorise third-party access. By using our service, you
              confirm that you have the necessary rights or licences for any repository you import.
            </p>
          </Section>

          {/* 5. AI Processing */}
          <Section id="ai" title="5. AI Processing & Third-Party Models">
            <p>
              {COMPANY_NAME} sends repository code excerpts and analysis results to an AI language model to generate
              course content. We use a pool of AI providers in priority order:
            </p>
            <List items={[
              'Primary: Google Gemini (AI Studio) — up to 6 API keys rotated automatically for capacity',
              'Secondary backup: OpenRouter — used only when all Gemini daily quotas are exhausted',
              'Optional backup: DeepSeek V3 — if configured',
              'Self-hosted models on Vast.ai or local Ollama can also be configured — in that case no code leaves your infrastructure',
            ]} />
            <p>Regarding what is sent and how it is handled:</p>
            <List items={[
              'Code sent to AI models is limited to relevant file snippets (up to 4 KB per file, max 5 files per lesson) — we do not send the entire repository',
              'If using Google Gemini, your data is subject to Google\'s API terms and privacy policy at ai.google.dev/terms',
              'If using OpenRouter, your data is subject to OpenRouter\'s privacy policy at openrouter.ai/privacy',
              'AI-generated course content is educational in nature and may contain inaccuracies — always verify code before using in production',
              'Generated content is stored in our database and shared across all users who import the same repository',
            ]} />
          </Section>

          {/* 6. Data Sharing */}
          <Section id="sharing" title="6. Data Sharing & Disclosure">
            <p>
              <strong className="text-foreground">We do not sell your personal data.</strong> We do not share your
              personal information with third parties for their own marketing purposes.
            </p>
            <p className="pt-2">We may share data in the following limited circumstances:</p>
            <List items={[
              'Service providers: Companies that help us operate the platform (hosting, analytics, error tracking) under strict data processing agreements',
              'AI providers: Code excerpts sent to configured AI models for course generation (see Section 5)',
              'Legal requirements: When required by law, court order, or to protect our rights and the safety of users',
              'Business transfers: In connection with a merger, acquisition, or sale of assets, with appropriate notice to you',
              'With your consent: Any other sharing will only occur with your explicit consent',
            ]} />
            <p className="pt-2">
              <strong className="text-foreground">Third-party integrations (when configured):</strong> If you or your
              administrator enables optional integrations — such as Clerk (authentication), Google Analytics (usage
              analytics), PostHog (product analytics), or Cloudflare (security/DDoS protection) — those services
              have their own privacy policies that apply.
            </p>
          </Section>

          {/* 7. Security */}
          <Section id="security" title="7. Data Security">
            <p>We implement industry-standard security measures to protect your information:</p>
            <List items={[
              'AES-256-GCM encryption for sensitive database fields (e.g., GitHub OAuth tokens)',
              'HTTPS/TLS 1.2+ encryption for all data in transit',
              'HTTP security headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy)',
              'Session tokens stored as httpOnly, SameSite cookies, never accessible to JavaScript',
              'Automated dependency vulnerability scanning via GitHub CodeQL and pnpm audit',
              'Rate limiting on API endpoints to prevent brute-force attacks',
              'Regular security audits and responsible disclosure policy',
            ]} />
            <p>
              Despite these measures, no method of transmission or storage is 100% secure. If you discover a
              security vulnerability, please report it to <strong>{CONTACT_EMAIL}</strong> rather than disclosing
              it publicly.
            </p>
          </Section>

          {/* 8. Data Retention */}
          <Section id="retention" title="8. Data Retention">
            <p>We retain your personal data for as long as necessary to provide our services and comply with legal obligations:</p>
            <List items={[
              'Account data (name, email, profile): Retained while your account is active',
              'Learning progress, XP, streak, quiz attempts: Retained while your account is active',
              'Cloned repository files: Deleted from our servers immediately after course generation completes or fails — not stored beyond the processing window',
              'Generated course content (lessons, quizzes): Retained indefinitely as public educational material, disassociated from your identity after account deletion',
              'Server logs and error reports: Retained for up to 90 days',
              'Anonymised analytics: May be retained indefinitely in aggregated, non-identifiable form',
            ]} />
            <p>
              When you delete your account, all personal data linked to you is permanently removed within{' '}
              <strong className="text-foreground">30 days</strong>. See Section 9 for how to request deletion.
            </p>
          </Section>

          {/* 9. Account Deletion */}
          <Section id="deletion" title="9. Account Deletion & Data Removal">
            <p>
              You have the right to delete your account and all associated personal data at any time. {COMPANY_NAME}
              offers two deletion paths, accessible from your{' '}
              <strong className="text-foreground">Profile → Danger Zone</strong>:
            </p>

            <p className="pt-1"><strong className="text-foreground">Option A — Scheduled deletion (30-day grace period)</strong></p>
            <List items={[
              'Your account is queued for permanent deletion 30 days from the date of your request',
              'During this period your account remains active and you can cancel the deletion at any time from your profile page',
              'After 30 days, all personal data is permanently and irreversibly deleted',
            ]} />

            <p className="pt-1"><strong className="text-foreground">Option B — Immediate deletion</strong></p>
            <List items={[
              'Your account and all personal data are deleted instantly',
              'This action is permanent and cannot be undone',
              'You are signed out automatically',
            ]} />

            <p className="pt-2"><strong className="text-foreground">What gets deleted:</strong></p>
            <List items={[
              'Your name, email address, profile picture, and GitHub username',
              'All learning progress, XP, streak, level, and vibe score',
              'All quiz attempts and answers',
              'All concept mastery records',
              'All AI tutor conversation history',
              'Your GitHub OAuth token (encrypted)',
              'Active sessions and login credentials',
            ]} />

            <p className="pt-2"><strong className="text-foreground">What is NOT deleted:</strong></p>
            <List items={[
              'Course content generated from repositories you imported — this is public educational material and is retained in our database, disassociated from your identity',
              'Anonymised, aggregated analytics data that cannot be linked back to you',
            ]} />

            <p>
              If you cannot access your account and need to request deletion, email{' '}
              <strong>{CONTACT_EMAIL}</strong>. We will verify your identity and process the request
              within <strong className="text-foreground">30 days</strong> as required by GDPR and CCPA.
            </p>
          </Section>

          {/* 10. Your Rights */}
          <Section id="rights" title="10. Your Privacy Rights">
            <p><strong className="text-foreground">For all users:</strong></p>
            <List items={[
              'Access: Request a copy of the personal data we hold about you',
              'Correction: Request correction of inaccurate or incomplete data',
              'Deletion: Request deletion of your account and associated personal data',
              'Export: Request your learning data in a portable format',
            ]} />

            <p className="pt-2"><strong className="text-foreground">Additional rights under GDPR (EU/EEA/UK residents):</strong></p>
            <List items={[
              'Right to restrict processing in certain circumstances',
              'Right to object to processing based on legitimate interests',
              'Right not to be subject to solely automated decision-making with significant effects',
              'Right to lodge a complaint with your local data protection authority (e.g., ICO in the UK, CNIL in France)',
            ]} />

            <p className="pt-2"><strong className="text-foreground">Additional rights under CCPA (California residents):</strong></p>
            <List items={[
              'Right to know what personal information is collected, used, disclosed, or sold',
              'Right to delete personal information (subject to exceptions)',
              'Right to opt out of the sale of personal information (we do not sell your data)',
              'Right to non-discrimination for exercising your privacy rights',
            ]} />

            <p className="pt-2">
              To exercise any of these rights, contact us at <strong>{CONTACT_EMAIL}</strong>. We will respond
              within 30 days (GDPR) or 45 days (CCPA). We may ask you to verify your identity before processing
              your request.
            </p>
          </Section>

          {/* 11. Cookies */}
          <Section id="cookies" title="11. Cookies & Tracking Technologies">
            <p>We use the following types of cookies and similar technologies:</p>
            <List items={[
              'Essential cookies: Session authentication tokens (httpOnly, required for the service to function)',
              'Preference cookies: Theme preference (light/dark mode, stored in localStorage)',
              'Analytics cookies: If Google Analytics or PostHog is configured, anonymous usage data is collected',
              'Security cookies: CSRF protection tokens',
            ]} />
            <p>
              We do not use tracking cookies for advertising. You can disable non-essential cookies in your browser
              settings; however, disabling essential cookies will prevent you from logging in.
            </p>
          </Section>

          {/* 12. Children's Privacy */}
          <Section id="children" title="12. Children's Privacy (COPPA)">
            <p>
              {COMPANY_NAME} is not directed to children under the age of 13 (or 16 in the EU, pursuant to GDPR
              Article 8). We do not knowingly collect personal information from children under these ages.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal information
              without your consent, please contact us at <strong>{CONTACT_EMAIL}</strong> and we will delete
              that information promptly.
            </p>
            <p>
              By creating an account, you confirm that you are at least 13 years of age (or the minimum digital
              age of consent in your jurisdiction if higher).
            </p>
          </Section>

          {/* 13. International Transfers */}
          <Section id="transfers" title="13. International Data Transfers">
            <p>
              {COMPANY_NAME} may process and store your data in the United States, European Union, or other
              countries where our service providers operate. If you are located in the EU/EEA, transfers of your
              personal data outside the EU/EEA are safeguarded by:
            </p>
            <List items={[
              'Standard Contractual Clauses (SCCs) approved by the European Commission',
              'Adequacy decisions where applicable',
              'Other appropriate safeguards as required by applicable law',
            ]} />
          </Section>

          {/* 14. Policy Changes */}
          <Section id="changes" title="14. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we will notify
              you by:
            </p>
            <List items={[
              'Displaying a prominent notice on our website',
              'Sending an email to the address associated with your account',
              'Updating the "Effective date" at the top of this page',
            ]} />
            <p>
              Your continued use of the service after the effective date of the updated policy constitutes your
              acceptance of the changes. If you do not agree with the updated policy, you must discontinue use
              of the service.
            </p>
          </Section>

          {/* 15. Contact */}
          <Section id="contact" title="15. Contact Us">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we process
              your personal data, please contact us:
            </p>
            <div className="rounded-2xl border border-border bg-card p-5 text-foreground">
              <p className="font-semibold">{COMPANY_NAME}</p>
              <p className="mt-1 text-muted-foreground">Privacy & Data Protection Enquiries</p>
              <p className="mt-2">
                Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-violet hover:underline">{CONTACT_EMAIL}</a>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">We aim to respond within 3 business days.</p>
            </div>
            <p>
              <strong className="text-foreground">EU/UK Representative:</strong> If you are based in the EU or UK
              and have concerns about our data practices, you also have the right to lodge a complaint with your
              local supervisory authority.
            </p>
          </Section>

          <hr className="border-border" />

          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} {COMPANY_NAME}. Effective {EFFECTIVE_DATE}.</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
