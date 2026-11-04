import LegalPage from '@/components/LegalPage';

export const metadata = { title: 'Terms of Service · NexusCode' };

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="November 2026"
      sections={[
        { heading: 'Beta service', paras: ['NexusCode is in beta. Features may change, break or be removed, and progress data may occasionally be reset. The service is provided "as is" without warranties.'] },
        { heading: 'Eligibility', paras: ['You must be at least 13 years old to create an account. If you are under the age of majority where you live, you need a parent or guardian to agree to these terms.'] },
        { heading: 'Your account', items: ['Keep your password private; you are responsible for activity on your account.', 'Provide an accurate email address so we can reach you about your account.', 'One person per account.'] },
        { heading: 'Acceptable use', items: ['No harassment, hate speech, spam or illegal content in Community or anywhere else.', 'No attempts to break, overload or reverse-engineer the service, or to cheat XP, energy or leaderboards through exploits.', 'No using Nexus AI to generate harmful content or to bypass usage limits.'] },
        { heading: 'Your content', paras: ['You keep ownership of what you post, such as Community posts, replies and Playground code. You give us permission to store and display it as needed to run the service. Moderators may remove content that breaks these rules.'] },
        { heading: 'Nexus AI', paras: ['Nexus AI is powered by a third-party AI model and can be wrong. Check important answers yourself. Usage is limited per day and limits may change.'] },
        { heading: 'Paid plans and virtual items', paras: ['Virtual items, XP and emblems have no cash value. Details of any paid plan are shown at purchase.'] },
        { heading: 'Suspension and deletion', paras: ['We may suspend accounts that break these terms. You can ask us to delete your account at any time (see Contact).'] },
        { heading: 'Liability', paras: ['To the extent allowed by law, NexusCode is not liable for indirect or consequential losses arising from use of the service.'] },
        { heading: 'Changes and contact', paras: ['We may update these terms and will note the date above. Questions? Use the Contact page.'] },
      ]}
    />
  );
}
