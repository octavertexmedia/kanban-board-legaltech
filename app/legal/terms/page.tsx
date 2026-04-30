import type { Metadata } from "next"
import { LegalDocShell } from "@/components/legal/legal-doc-shell"
import { APP_DISPLAY_NAME, OCTAVERTEX_MARKETING_URL } from "@/lib/brand"

const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
  "https://kanban.vertexcrm.in"

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_DISPLAY_NAME}`,
  description: `Terms of Service for ${APP_DISPLAY_NAME}, a project management product operated by OctaVertex Media.`,
}

export default function TermsOfServicePage() {
  return (
    <LegalDocShell title="Terms of Service" lastUpdated="May 1, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of{" "}
        <strong>{APP_DISPLAY_NAME}</strong> (the &quot;Service&quot;), including the website and
        application available at{" "}
        <a href={APP_ORIGIN} rel="noopener noreferrer">
          {APP_ORIGIN.replace(/^https?:\/\//, "")}
        </a>
        . The Service is provided by <strong>OctaVertex Media</strong> (&quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;). By using the Service, you agree to these Terms.
      </p>

      <h2>1. Eligibility and accounts</h2>
      <p>
        You must be authorized to use the Service (for example, through an employer or client
        invitation). You are responsible for maintaining the confidentiality of your credentials
        and for all activity under your account. You must provide accurate registration
        information and notify us promptly of any unauthorized use.
      </p>

      <h2>2. The Service</h2>
      <p>
        {APP_DISPLAY_NAME} provides project management features such as boards, tasks,
        collaboration tools, and related functionality. We may modify, suspend, or discontinue
        features with reasonable notice where practicable. We do not guarantee uninterrupted or
        error-free operation.
      </p>

      <h2>3. Authentication</h2>
      <p>
        Sign-in and account security may be provided through our authentication provider (including
        email-based verification). Your use of that authentication is also subject to the
        provider&apos;s applicable terms and policies.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate any law or third-party rights;</li>
        <li>Probe, scan, or test the vulnerability of the Service without authorization;</li>
        <li>Interfere with or disrupt the Service or servers or networks connected to it;</li>
        <li>Attempt to gain unauthorized access to data, accounts, or systems;</li>
        <li>Use the Service to distribute malware, spam, or harmful content;</li>
        <li>Reverse engineer or attempt to extract source code except where permitted by law;</li>
        <li>Use the Service to build a competing product using similar functionality, if prohibited
          by a separate agreement with us.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        You retain ownership of content you submit to the Service (&quot;Your Content&quot;). You
        grant us a limited license to host, process, and display Your Content solely to operate and
        improve the Service for you and your organization. You represent that you have the rights
        necessary to grant this license.
      </p>

      <h2>6. Confidentiality</h2>
      <p>
        If you receive access to non-public information through the Service, you must protect it
        in accordance with any applicable agreement (such as an NDA or client engagement) and
        applicable law.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        The Service may integrate with third-party services (for example, hosting, email, or
        analytics). Your use of those services may be subject to separate terms. We are not
        responsible for third-party services.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot; TO THE MAXIMUM
        EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR
        STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
        PURPOSE, AND NON-INFRINGEMENT.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA,
        OR GOODWILL. OUR AGGREGATE LIABILITY FOR CLAIMS ARISING OUT OF THESE TERMS OR THE SERVICE
        WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE
        MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (US$100), IF NO FEES APPLIED.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You will defend and indemnify us against claims arising from Your Content, your misuse of
        the Service, or your violation of these Terms, to the extent permitted by law.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate access to the Service for violation of these Terms or as
        required by law. You may stop using the Service at any time. Provisions that by their
        nature should survive will survive termination.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms from time to time. We will post the updated version on this page
        and update the &quot;Last updated&quot; date. Continued use after changes constitutes
        acceptance of the revised Terms, except where applicable law requires additional consent.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by the laws applicable to OctaVertex Media and its operating
        jurisdiction, without regard to conflict-of-law rules, unless a mandatory law of your
        country provides otherwise.
      </p>

      <h2>14. Contact</h2>
      <p>
        For questions about these Terms, contact us through{" "}
        <a href={OCTAVERTEX_MARKETING_URL} target="_blank" rel="noopener noreferrer">
          octavertexmedia.com
        </a>{" "}
        or your organization&apos;s administrator for {APP_DISPLAY_NAME}.
      </p>
    </LegalDocShell>
  )
}
