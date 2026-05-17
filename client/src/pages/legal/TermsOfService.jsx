import { DocumentTextIcon } from '@heroicons/react/24/outline';
import LegalPageLayout, { LegalSection, LegalCard } from '../../components/legal/LegalPageLayout';

const TermsOfService = () => (
    <LegalPageLayout
        icon={DocumentTextIcon}
        title="Terms of Service"
        subtitle="Please read these terms carefully before using SportsSphere. By creating an account, you agree to be bound by them."
        lastUpdated="May 17, 2026"
    >
        <LegalCard>
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the SportsSphere
                platform, including court booking, coaching, sparring matchmaking, and tournaments.
            </p>
        </LegalCard>

        <LegalSection id="acceptance" title="1. Acceptance of terms">
            <p>
                By registering, logging in, or using any part of the platform, you confirm that you are at
                least 16 years old (or the minimum age required in your jurisdiction) and agree to these
                Terms and our Privacy Policy.
            </p>
        </LegalSection>

        <LegalSection id="accounts" title="2. Accounts and eligibility">
            <p>You are responsible for:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3">
                <li>Providing accurate registration information and keeping it up to date.</li>
                <li>Maintaining the confidentiality of your password and account activity.</li>
                <li>Using the platform only for lawful sports-related purposes.</li>
            </ul>
            <p className="mt-4">
                Professional players, coaches, and organizers may be subject to additional verification.
                We may suspend or terminate accounts that violate these Terms or misrepresent qualifications.
            </p>
        </LegalSection>

        <LegalSection id="bookings" title="3. Bookings, sessions, and payments">
            <p>
                Court bookings, coaching sessions, and sparring requests are subject to availability and
                confirmation by the relevant party (coach, professional player, or venue). Prices are
                displayed in PKR unless stated otherwise.
            </p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3">
                <li>Payment must be completed where required before a booking is confirmed.</li>
                <li>Cancellation and refund rules depend on the booking type and status shown at checkout.</li>
                <li>SportsSphere facilitates transactions but is not responsible for on-site facility conditions unless we operate the venue directly.</li>
            </ul>
        </LegalSection>

        <LegalSection id="conduct" title="4. User conduct">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3">
                <li>Harass, threaten, or discriminate against other users.</li>
                <li>Post false reviews, fake profiles, or misleading availability.</li>
                <li>Attempt to bypass payments or abuse promotional features.</li>
                <li>Interfere with platform security or scrape data without permission.</li>
            </ul>
        </LegalSection>

        <LegalSection id="tournaments" title="5. Tournaments and events">
            <p>
                Tournament rules, entry fees, and schedules are set by organizers. By registering for an
                event, you agree to follow the organizer&apos;s rules and accept that bracket changes or
                cancellations may occur due to weather, venue issues, or insufficient entries.
            </p>
        </LegalSection>

        <LegalSection id="ip" title="6. Intellectual property">
            <p>
                The SportsSphere name, logo, software, and design are owned by us or our licensors. You may
                not copy, modify, or distribute platform content without written permission. You retain
                ownership of content you upload but grant us a license to display it as needed to operate the service.
            </p>
        </LegalSection>

        <LegalSection id="disclaimer" title="7. Disclaimers and limitation of liability">
            <p>
                The platform is provided &quot;as is.&quot; We do not guarantee uninterrupted service or
                specific sports outcomes. To the fullest extent permitted by law, SportsSphere is not
                liable for indirect, incidental, or consequential damages arising from your use of the
                platform, including injuries sustained during physical activity arranged through the service.
            </p>
        </LegalSection>

        <LegalSection id="changes" title="8. Changes to these terms">
            <p>
                We may update these Terms from time to time. Material changes will be posted on this page
                with an updated date. Continued use after changes constitutes acceptance of the revised Terms.
            </p>
        </LegalSection>

        <LegalSection id="contact" title="9. Contact">
            <p>
                Questions about these Terms? Contact{' '}
                <a href="mailto:legal@sportssphere.com" className="text-indigo-600 font-bold hover:underline">
                    legal@sportssphere.com
                </a>{' '}
                or visit the{' '}
                <a href="/support" className="text-indigo-600 font-bold hover:underline">
                    Support Center
                </a>
                .
            </p>
        </LegalSection>
    </LegalPageLayout>
);

export default TermsOfService;
