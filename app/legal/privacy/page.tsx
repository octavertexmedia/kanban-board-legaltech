import type { Metadata } from "next"
import { LegalDocShell } from "@/components/legal/legal-doc-shell"
import { APP_DISPLAY_NAME, OCTAVERTEX_MARKETING_URL } from "@/lib/brand"
import Link from "next/link"

const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
  "https://kanban.vertexcrm.in"

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_DISPLAY_NAME}`,
  description: `Privacy Policy for ${APP_DISPLAY_NAME} (OctaVertex Media): how we collect, use, and protect information.`,
}

export default function PrivacyPolicyPage() {
  return (
    <LegalDocShell title="Privacy Policy" lastUpdated="May 1, 2026">
      <p>
        This Privacy Policy describes how <strong>OctaVertex Media</strong> (&quot;we,&quot;
        &quot;us,&quot;) collects, uses, and shares information in connection with{" "}
        <strong>{APP_DISPLAY_NAME}</strong> (the &quot;Service&quot;), including the site at{" "}
        <a href={APP_ORIGIN} rel="noopener noreferrer">
          {APP_ORIGIN.replace(/^https?:\/\//, "")}
        </a>
        . If you use the Service on behalf of an organization, that organization&apos;s
        instructions and agreements may also apply.
      </p>

      <h2>1. Information we collect</h2>
      <h3>1.1 You provide</h3>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, password or authentication tokens,
          role, and profile details you choose to add.
        </li>
        <li>
          <strong>Content:</strong> projects, tasks, comments, files, meeting details, knowledge
          articles, and other materials you create or upload in the Service.
        </li>
        <li>
          <strong>Support:</strong> information you send when you contact us or your admin.
        </li>
      </ul>
      <h3>1.2 Automatically collected</h3>
      <ul>
        <li>
          <strong>Technical data:</strong> IP address, device/browser type, general location
          (derived from IP), timestamps, and similar diagnostics needed to secure and operate the
          Service.
        </li>
        <li>
          <strong>Cookies and similar technologies:</strong> we use cookies and similar
          technologies for session management, security, and preferences. Essential cookies are
          required for sign-in and core functionality.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <p>We use information to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service;</li>
        <li>Authenticate users and protect accounts;</li>
        <li>Operate collaboration features you use (for example, sharing work with your team);</li>
        <li>Detect, prevent, and address fraud, abuse, and security issues;</li>
        <li>Comply with law and enforce our terms; and</li>
        <li>Communicate with you about the Service (for example, security or product notices).</li>
      </ul>

      <h2>3. Legal bases (where applicable)</h2>
      <p>
        If the GDPR or similar laws apply, we rely on bases such as: performance of a contract,
        legitimate interests (for example, securing the Service), consent where required, and legal
        obligation.
      </p>

      <h2>4. How we share information</h2>
      <p>We may share information:</p>
      <ul>
        <li>
          <strong>With your organization:</strong> admins and members you collaborate with can see
          content according to permissions in the Service.
        </li>
        <li>
          <strong>Service providers:</strong> vendors that host data, deliver email, provide
          authentication, analytics, or other infrastructure, bound by confidentiality and
          processing terms.
        </li>
        <li>
          <strong>Legal and safety:</strong> when required by law, legal process, or to protect
          rights, safety, and security.
        </li>
        <li>
          <strong>Business transfers:</strong> in connection with a merger, acquisition, or asset
          sale, subject to appropriate safeguards.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>5. Data retention</h2>
      <p>
        We retain information for as long as needed to provide the Service, comply with law,
        resolve disputes, and enforce agreements. Retention periods may depend on your
        organization&apos;s settings and backups.
      </p>

      <h2>6. Security</h2>
      <p>
        We implement technical and organizational measures designed to protect information.
        However, no method of transmission or storage is completely secure.
      </p>

      <h2>7. International transfers</h2>
      <p>
        We may process information in countries other than your own. Where required, we use
        appropriate safeguards (such as standard contractual clauses) for cross-border transfers.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or restrict
        processing of your personal information, or to object to certain processing. You may also
        have the right to lodge a complaint with a supervisory authority. To exercise rights,
        contact your organization&apos;s administrator or us as described below.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is not directed to children under 16 (or the age required in your region). We
        do not knowingly collect personal information from children.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the new version on this
        page and update the &quot;Last updated&quot; date.
      </p>

      <h2>11. Related terms</h2>
      <p>
        Our{" "}
        <Link href="/legal/terms" className="font-medium text-primary underline-offset-4 hover:underline">
          Terms of Service
        </Link>{" "}
        also govern use of the Service.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy questions, contact us through{" "}
        <a href={OCTAVERTEX_MARKETING_URL} target="_blank" rel="noopener noreferrer">
          octavertexmedia.com
        </a>{" "}
        or your organization&apos;s administrator.
      </p>
    </LegalDocShell>
  )
}
