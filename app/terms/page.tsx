// Terms of Service — Gitpath
// Governed by general contract law principles applicable in most jurisdictions.
// Addresses GDPR, CCPA, DMCA, GitHub ToS compliance, and AI-generated content.
// Last reviewed: June 2026

import Link from 'next/link';
import { Code2, FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Gitpath',
  description: 'The terms and conditions governing your use of the Gitpath platform.',
};

const EFFECTIVE_DATE = 'June 20, 2026';
const CONTACT_EMAIL = 'legal@gitpath.app';
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
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'description', label: 'Service Description' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'accounts', label: 'User Accounts' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'repositories', label: 'Repository & Code Usage' },
  { id: 'ai-content', label: 'AI-Generated Content' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'dmca', label: 'DMCA & Copyright' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
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
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1.5 text-sm font-medium text-brand-cyan">
              <FileText className="h-4 w-4" /> Terms of Service
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Please read these Terms of Service carefully before using {COMPANY_NAME}. By creating an account
              or using our services, you agree to be bound by these terms.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span><strong className="text-foreground">Effective date:</strong> {EFFECTIVE_DATE}</span>
              <span><strong className="text-foreground">Last updated:</strong> {EFFECTIVE_DATE}</span>
            </div>
          </div>

          <hr className="border-border" />

          {/* 1. Acceptance */}
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you")
              and {COMPANY_NAME} ("we", "us", "our") governing your access to and use of the {COMPANY_NAME}
              platform, including the website, APIs, and all related services (collectively, the "Service").
            </p>
            <p>
              By creating an account, clicking "Get started", or otherwise accessing or using the Service, you
              acknowledge that you have read, understood, and agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-brand-violet hover:underline">Privacy Policy</Link>,
              which is incorporated herein by reference.
            </p>
            <p>
              If you are using the Service on behalf of a company or other legal entity, you represent that you
              have the authority to bind that entity to these Terms. If you do not agree to these Terms, you must
              not use the Service.
            </p>
          </Section>

          {/* 2. Description */}
          <Section id="description" title="2. Service Description">
            <p>
              {COMPANY_NAME} is an educational software-as-a-service (SaaS) platform that enables users to:
            </p>
            <List items={[
              'Import public GitHub repositories via URL (private repositories require a GitHub personal access token configured in your account)',
              'Receive AI-generated interactive learning courses based on the repository\'s code structure and content',
              'Engage with lessons, quizzes, concept maps, and code walkthroughs',
              'Track learning progress, earn XP points, level up, and compete on a leaderboard',
              'Explore mastered concepts and completed lessons on a personal profile',
              'Use an AI tutor to ask questions about repository content',
            ]} />
            <p>
              The Service is intended for educational purposes only. Course content is generated automatically
              by artificial intelligence and is not intended to constitute professional advice of any kind.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time,
              with reasonable notice where practicable.
            </p>
          </Section>

          {/* 3. Eligibility */}
          <Section id="eligibility" title="3. Eligibility">
            <p>To use the Service, you must:</p>
            <List items={[
              'Be at least 13 years of age (or the minimum digital age of consent in your jurisdiction, whichever is higher — e.g., 16 in the EU under GDPR Article 8)',
              'Have the legal capacity to enter into a binding contract under applicable law',
              'Not be a person barred from receiving services under the laws of your jurisdiction',
              `Not have a previously terminated ${COMPANY_NAME} account due to a violation of these Terms`,
            ]} />
            <p>
              If you are under 18, you confirm that a parent or legal guardian has reviewed and consented to
              these Terms on your behalf.
            </p>
          </Section>

          {/* 4. Accounts */}
          <Section id="accounts" title="4. User Accounts">
            <p>
              <strong className="text-foreground">4.1 Account Creation.</strong> You may create an account by
              authenticating through a supported third-party provider (e.g., GitHub OAuth). You agree to
              provide accurate, current, and complete information.
            </p>
            <p>
              <strong className="text-foreground">4.2 Account Security.</strong> You are responsible for
              maintaining the confidentiality of your account credentials and for all activities that occur
              under your account. You must notify us immediately at {CONTACT_EMAIL} if you suspect any
              unauthorised access or security breach.
            </p>
            <p>
              <strong className="text-foreground">4.3 One account per person.</strong> Each user may maintain
              only one active account. Creating multiple accounts to circumvent suspensions or restrictions is
              prohibited.
            </p>
            <p>
              <strong className="text-foreground">4.4 Account data.</strong> Your personal learning data —
              progress, XP, quiz history, and streak — is private to your account. Course content generated
              from repositories is stored globally and is accessible to any user who imports the same repository;
              it is not exclusive to your account. Leaderboard rankings display your username and XP publicly
              to other logged-in users.
            </p>
          </Section>

          {/* 5. Acceptable Use */}
          <Section id="acceptable-use" title="5. Acceptable Use Policy">
            <p>You agree to use the Service only for lawful purposes. You must NOT:</p>
            <List items={[
              'Violate any applicable local, national, or international law or regulation',
              'Import or process repositories containing illegal content, malware, or materials that violate third-party rights',
              'Attempt to reverse-engineer, decompile, or extract the Service\'s source code, AI models, or proprietary algorithms',
              'Use automated tools to scrape, crawl, or bulk-download content from the Service',
              'Attempt to circumvent, disable, or interfere with security features or rate limits',
              'Impersonate any person or entity or misrepresent your affiliation with any person or entity',
              'Upload or transmit viruses, malware, or any other harmful code',
              'Use the Service to develop a competing product or service',
              'Harass, threaten, or harm other users',
              'Use the Service in a way that could damage, disable, overburden, or impair it',
              'Introduce any content that is defamatory, obscene, or violates third-party intellectual property rights',
            ]} />
            <p>
              Violation of this policy may result in immediate suspension or termination of your account
              without refund and may be referred to appropriate legal authorities.
            </p>
          </Section>

          {/* 6. Repository & Code Usage */}
          <Section id="repositories" title="6. Repository & Code Usage">
            <p>
              <strong className="text-foreground">6.1 Your responsibility.</strong> You represent and warrant
              that you have the legal right to import any repository you submit to the Service. This includes:
            </p>
            <List items={[
              'Public repositories: You must comply with the repository\'s open-source licence (e.g., MIT, Apache 2.0, GPL)',
              'Private repositories: You must own the repository or have explicit permission from the owner to process it through a third-party service',
              'Repositories belonging to your employer: You must have authorisation from your employer before importing',
            ]} />
            <p>
              <strong className="text-foreground">6.2 Data handling.</strong> Cloned repository files are used
              solely for analysis and AI course generation, then permanently deleted from our servers (whether
              generation succeeds or fails). The generated course content — lessons, quizzes, and code snippets —
              is stored in our database and is accessible to any user who imports the same repository URL.
              Courses are not exclusive to the user who first imported them. See our{' '}
              <Link href="/privacy" className="text-brand-violet hover:underline">Privacy Policy</Link> for
              full details.
            </p>
            <p>
              <strong className="text-foreground">6.3 GitHub Terms of Service.</strong> Use of this Service
              in connection with GitHub is subject to GitHub's own{' '}
              <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
                target="_blank" rel="noopener noreferrer"
                className="text-brand-violet hover:underline">Terms of Service</a>.
              You are solely responsible for ensuring your use complies with GitHub's policies.
            </p>
            <p>
              <strong className="text-foreground">6.4 No endorsement.</strong> {COMPANY_NAME} does not endorse,
              guarantee, or take responsibility for the quality, security, or fitness of any repository you
              import or the code it contains.
            </p>
          </Section>

          {/* 7. AI-Generated Content */}
          <Section id="ai-content" title="7. AI-Generated Content">
            <p>
              The course content produced by {COMPANY_NAME} — including lesson explanations, code walkthroughs,
              quizzes, and concept maps — is generated by artificial intelligence and is subject to the
              following limitations:
            </p>
            <List items={[
              'AI-generated content may contain errors, inaccuracies, or outdated information',
              'Courses are for educational and informational purposes only — they do not constitute professional, legal, financial, or security advice',
              'Generated content may reflect biases present in the underlying training data of the AI model',
              'Code examples and explanations should be independently verified before use in production systems',
              'The AI model may occasionally hallucinate details, functions, or behaviours that do not exist in the actual repository',
            ]} />
            <p>
              <strong className="text-foreground">Ownership of generated content.</strong> AI-generated course
              content derived from your repository is made available to you under a limited, non-exclusive,
              non-transferable licence for personal educational use. We do not claim copyright in AI-generated
              content under applicable law; however, commercial redistribution of generated courses is
              prohibited without our prior written consent.
            </p>
          </Section>

          {/* 8. Intellectual Property */}
          <Section id="ip" title="8. Intellectual Property">
            <p>
              <strong className="text-foreground">8.1 Our IP.</strong> The {COMPANY_NAME} platform, including
              its design, software, trademarks, logos, and original content (excluding AI-generated course
              content and your repository code), is the intellectual property of {COMPANY_NAME} and is
              protected by copyright, trademark, and other intellectual property laws. You may not copy,
              modify, distribute, or create derivative works from any part of the Service without our prior
              written consent.
            </p>
            <p>
              <strong className="text-foreground">8.2 Your content.</strong> You retain all ownership rights
              in any repositories you import and any original content you create. By importing a repository,
              you grant us a limited, non-exclusive, royalty-free licence to process the repository solely
              for the purpose of generating your course and providing the Service.
            </p>
            <p>
              <strong className="text-foreground">8.3 Feedback.</strong> If you provide feedback or suggestions
              about the Service, you grant us the right to use that feedback without obligation or compensation
              to you.
            </p>
          </Section>

          {/* 9. DMCA */}
          <Section id="dmca" title="9. Copyright & DMCA Takedowns">
            <p>
              We respect intellectual property rights and comply with the Digital Millennium Copyright Act
              (DMCA) and equivalent international copyright laws. If you believe that content on our Service
              infringes your copyright, please submit a written notification to our designated agent containing:
            </p>
            <List items={[
              'A physical or electronic signature of the copyright owner or authorised agent',
              'Identification of the copyrighted work claimed to have been infringed',
              'Identification of the material claimed to be infringing and its location on the Service',
              'Your contact information (address, telephone number, email)',
              'A statement that you have a good-faith belief that the use is not authorised',
              'A statement under penalty of perjury that the information is accurate and you are authorised to act',
            ]} />
            <p>
              Send DMCA notices to: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-violet hover:underline">{CONTACT_EMAIL}</a>
            </p>
            <p>
              Counter-notifications and repeat infringer policy are handled in accordance with the DMCA.
              We may terminate the accounts of users who are determined to be repeat infringers.
            </p>
          </Section>

          {/* 10. Privacy */}
          <Section id="privacy" title="10. Privacy">
            <p>
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-brand-violet hover:underline">Privacy Policy</Link>,
              which explains how we collect, use, and protect your personal information. By using the Service,
              you consent to our data practices as described in the Privacy Policy.
            </p>
          </Section>

          {/* 11. Disclaimers */}
          <Section id="disclaimers" title="11. Disclaimers of Warranties">
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, NON-INFRINGEMENT, AND UNINTERRUPTED OR ERROR-FREE OPERATION.
            </p>
            <p>We do not warrant that:</p>
            <List items={[
              'The Service will be available at all times or free from errors or interruptions',
              'AI-generated course content will be accurate, complete, or up-to-date',
              'The Service will meet your specific educational or professional requirements',
              'Any defects or errors will be corrected',
              'The Service is free of viruses or other harmful components',
            ]} />
            <p>
              Some jurisdictions do not allow exclusion of implied warranties, so some of the above may not
              apply to you. Nothing in these Terms excludes liability that cannot be excluded or limited under
              applicable consumer protection law.
            </p>
          </Section>

          {/* 12. Limitation of Liability */}
          <Section id="liability" title="12. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {COMPANY_NAME.toUpperCase()},
              ITS DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
            </p>
            <List items={[
              'Loss of profits, revenue, data, goodwill, or other intangible losses',
              'Errors in AI-generated content that result in professional, financial, or legal harm',
              'Unauthorised access to or alteration of your data',
              'Loss or damage to repository data or generated courses',
              'Any other matter relating to the Service',
            ]} />
            <p>
              IN ALL CASES, OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED
              TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US
              IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) USD $100.
            </p>
            <p>
              These limitations apply regardless of the legal theory on which the claim is based. Some
              jurisdictions (including the EU and certain US states) do not allow limitation of liability
              for certain types of damages, so some of the above may not apply to you.
            </p>
          </Section>

          {/* 13. Indemnification */}
          <Section id="indemnification" title="13. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless {COMPANY_NAME} and its officers, directors,
              employees, agents, and licensors from and against any claims, liabilities, damages, losses,
              costs, and expenses (including reasonable legal fees) arising out of or in any way connected with:
            </p>
            <List items={[
              'Your access to or use of the Service',
              'Your violation of these Terms',
              'Your violation of any applicable law or the rights of a third party',
              'Any repository you import that infringes the intellectual property or other rights of a third party',
              'Any AI-generated content you distribute or rely on without proper verification',
            ]} />
          </Section>

          {/* 14. Termination */}
          <Section id="termination" title="14. Termination">
            <p>
              <strong className="text-foreground">By you.</strong> You may delete your account at any time
              through the profile settings page. Upon deletion, your personal data will be removed in
              accordance with our Privacy Policy.
            </p>
            <p>
              <strong className="text-foreground">By us.</strong> We reserve the right to suspend or
              terminate your account and access to the Service at any time, with or without cause, with
              or without notice, including for violation of these Terms, conduct we determine is harmful
              to other users or the platform, or inactivity for extended periods.
            </p>
            <p>
              <strong className="text-foreground">Effect of termination.</strong> Upon termination, your
              right to use the Service ceases immediately. Sections 7 (AI Content), 8 (IP), 11
              (Disclaimers), 12 (Liability), 13 (Indemnification), and 15 (Governing Law) survive
              termination.
            </p>
          </Section>

          {/* 15. Governing Law */}
          <Section id="governing-law" title="15. Governing Law & Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with applicable law. Where mandatory
              consumer protection laws of your country of residence apply, those laws shall take precedence.
            </p>
            <p>
              <strong className="text-foreground">For EU/EEA users:</strong> Nothing in these Terms affects
              your rights as a consumer under applicable EU consumer protection legislation, including the
              right to bring disputes before competent courts in your country of residence.
            </p>
            <p>
              <strong className="text-foreground">For UK users:</strong> These Terms are subject to the
              laws of England and Wales where applicable, without prejudice to your statutory rights.
            </p>
            <p>
              <strong className="text-foreground">Dispute resolution.</strong> We encourage you to contact
              us first at {CONTACT_EMAIL} to resolve any disputes informally. Most concerns can be resolved
              quickly this way. If a dispute cannot be resolved informally, it shall be submitted to binding
              arbitration or the courts of competent jurisdiction, as required by applicable law.
            </p>
            <p>
              <strong className="text-foreground">Class action waiver.</strong> Where permitted by law, you
              agree to resolve disputes with us individually, not as part of a class, consolidated, or
              representative action.
            </p>
          </Section>

          {/* 16. Changes */}
          <Section id="changes" title="16. Changes to These Terms">
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes, we will:
            </p>
            <List items={[
              'Update the "Effective date" at the top of this page',
              'Notify you by email or by displaying a prominent notice on the Service',
              'Provide at least 30 days\' notice before major changes take effect (where reasonably practicable)',
            ]} />
            <p>
              Your continued use of the Service after the effective date of revised Terms constitutes your
              acceptance. If you do not agree to the revised Terms, you must stop using the Service.
            </p>
          </Section>

          {/* 17. General Provisions */}
          <Section id="general" title="17. General Provisions">
            <p>
              <strong className="text-foreground">Entire Agreement.</strong> These Terms, together with the
              Privacy Policy and any supplemental terms, constitute the entire agreement between you and
              {COMPANY_NAME} regarding the Service.
            </p>
            <p>
              <strong className="text-foreground">Severability.</strong> If any provision of these Terms is
              found to be unenforceable, that provision will be modified to the minimum extent necessary, and
              the remaining provisions will continue in full force.
            </p>
            <p>
              <strong className="text-foreground">Waiver.</strong> Our failure to enforce any right or
              provision of these Terms does not constitute a waiver of that right or provision.
            </p>
            <p>
              <strong className="text-foreground">Assignment.</strong> You may not assign or transfer your
              rights under these Terms. We may assign our rights and obligations to an affiliate or in
              connection with a merger, acquisition, or sale of assets.
            </p>
            <p>
              <strong className="text-foreground">Force Majeure.</strong> We are not liable for delays or
              failures in performance resulting from causes beyond our reasonable control.
            </p>
          </Section>

          {/* 18. Contact */}
          <Section id="contact" title="18. Contact Us">
            <p>For legal enquiries, please contact us at:</p>
            <div className="rounded-2xl border border-border bg-card p-5 text-foreground">
              <p className="font-semibold">{COMPANY_NAME}</p>
              <p className="mt-1 text-muted-foreground">Legal & Compliance</p>
              <p className="mt-2">
                Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-violet hover:underline">{CONTACT_EMAIL}</a>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">We aim to respond to legal enquiries within 5 business days.</p>
            </div>
          </Section>

          <hr className="border-border" />

          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} {COMPANY_NAME}. Effective {EFFECTIVE_DATE}.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
