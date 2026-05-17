import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import LegalPageLayout, { LegalSection, LegalCard } from '../../components/legal/LegalPageLayout';

const PrivacyPolicy = () => (
    <LegalPageLayout
        icon={ShieldCheckIcon}
        title="Privacy Policy"
        subtitle="How SportsSphere collects, uses, and protects your personal information when you use our platform."
        lastUpdated="May 17, 2026"
    >
        <LegalCard>
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
                SportsSphere (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy.
                This policy explains what data we collect, why we collect it, and the choices you have.
            </p>
        </LegalCard>

        <LegalSection id="information" title="1. Information we collect">
            <p>We may collect the following types of information when you create an account or use our services:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3">
                <li>Account details: name, email address, phone number, city, and role (player, coach, organizer).</li>
                <li>Profile data: skill level, bio, availability, and verification documents where applicable.</li>
                <li>Booking and session data: court reservations, coaching sessions, sparring requests, and payment status.</li>
                <li>Usage data: device type, browser, IP address, and pages visited to improve platform performance.</li>
            </ul>
        </LegalSection>

        <LegalSection id="use" title="2. How we use your information">
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3">
                <li>Provide and operate court booking, coaching, sparring, and tournament features.</li>
                <li>Process payments and send booking confirmations or status updates.</li>
                <li>Verify professional and coach accounts when required.</li>
                <li>Send service-related notifications (e.g., request accepted, session reminders).</li>
                <li>Improve security, prevent fraud, and comply with legal obligations.</li>
            </ul>
        </LegalSection>

        <LegalSection id="sharing" title="3. Sharing of information">
            <p>
                We do not sell your personal data. We may share limited information with other users when
                necessary to complete a booking (e.g., your name with a coach or court organizer), with
                payment processors to handle transactions, or when required by law.
            </p>
        </LegalSection>

        <LegalSection id="security" title="4. Data security">
            <p>
                We use industry-standard measures including encrypted connections (HTTPS), access controls,
                and secure authentication. No method of transmission over the internet is 100% secure;
                we encourage you to use a strong password and keep your login credentials private.
            </p>
        </LegalSection>

        <LegalSection id="retention" title="5. Data retention">
            <p>
                We retain your data for as long as your account is active or as needed to provide services,
                resolve disputes, and meet legal requirements. You may request account deletion by contacting
                support.
            </p>
        </LegalSection>

        <LegalSection id="rights" title="6. Your rights">
            <p>You may have the right to:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3">
                <li>Access and update your profile information from your account settings.</li>
                <li>Request correction or deletion of your personal data, subject to legal limits.</li>
                <li>Opt out of non-essential marketing communications where offered.</li>
            </ul>
        </LegalSection>

        <LegalSection id="cookies" title="7. Cookies and local storage">
            <p>
                We use cookies and similar technologies to keep you signed in, remember preferences, and
                analyze how the platform is used. You can control cookies through your browser settings,
                though some features may not work correctly if cookies are disabled.
            </p>
        </LegalSection>

        <LegalSection id="contact" title="8. Contact us">
            <p>
                For privacy-related questions, email{' '}
                <a href="mailto:privacy@sportssphere.com" className="text-indigo-600 font-bold hover:underline">
                    privacy@sportssphere.com
                </a>{' '}
                or visit our{' '}
                <a href="/support" className="text-indigo-600 font-bold hover:underline">
                    Support Center
                </a>
                .
            </p>
        </LegalSection>
    </LegalPageLayout>
);

export default PrivacyPolicy;
