import LegalPage from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy · NexusCode' };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 2026"
      sections={[
        { heading: 'What we collect', items: ['Account details: username, email address and a hashed password (we never store your password in readable form).', 'Learning data: XP, streaks, progress, achievements, purchases and avatar choice.', 'Content you create: Community posts, replies, votes and reports.', 'Feedback you send through the Feedback button, including the page you were on and your browser type.', 'Messages you send to Nexus AI.'] },
        { heading: 'On your device', paras: ['We store a login token and some preferences and Playground projects in your browser storage (localStorage). Clearing your browser data removes them.'] },
        { heading: 'How we use it', items: ['To run the app: log you in, track progress, show leaderboards and Community.', 'To keep the service safe and fix bugs, including error reports.', 'We do not sell your data and do not show third-party ads.'] },
        { heading: 'Third parties', items: ['Nexus AI: the messages you send (and any files or images you attach) are sent to Google\'s Gemini API to generate replies. Do not share sensitive personal information with it.', 'Error monitoring (Sentry), if enabled, receives technical details of server errors.', 'Hosting and tunnel providers process traffic needed to deliver the app.'] },
        { heading: 'Public information', paras: ['Your username, avatar, level and Community posts may be visible to other users, including on leaderboards.'] },
        { heading: 'Retention and deletion', paras: ['We keep your data while your account is active. Ask us through the Contact page to delete your account and associated data, or to receive a copy of it.'] },
        { heading: 'Children', paras: ['NexusCode is for users 13 and older. If you believe a younger child has signed up, contact us and we will remove the account.'] },
        { heading: 'Security', paras: ['Passwords are hashed and traffic is encrypted in production. No system is perfectly secure, and this is a beta.'] },
        { heading: 'Changes and contact', paras: ['We will update the date above when this policy changes. Questions? Use the Contact page.'] },
      ]}
    />
  );
}
