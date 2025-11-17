import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 max-w-4xl">
        <Card className="p-8 space-y-6 border-2 border-red-900/40 bg-black/90 backdrop-blur-sm">
          <div>
            <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-2">
              <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">LEGAL</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">PRIVACY POLICY</h1>
            <p className="text-gray-400 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">1. Information We Collect</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              When you use BoxBoxd, we collect the following information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 font-medium ml-4">
              <li><strong className="text-white font-black">Account Information:</strong> Email address, username, and password (encrypted)</li>
              <li><strong className="text-white font-black">Profile Information:</strong> Display name, bio, profile picture, favorite drivers and teams</li>
              <li><strong className="text-white font-black">Content:</strong> Race logs, reviews, ratings, comments, lists, and tags you create</li>
              <li><strong className="text-white font-black">Social Interactions:</strong> Follows, likes, and comments on other users' content</li>
              <li><strong className="text-white font-black">Usage Data:</strong> How you interact with the app, including pages visited and features used</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">2. How We Use Your Information</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 font-medium ml-4">
              <li>Provide and maintain the BoxBoxd service</li>
              <li>Create and manage your account</li>
              <li>Enable social features like following users and sharing content</li>
              <li>Personalize your experience with recommendations</li>
              <li>Send you updates and notifications (with your consent)</li>
              <li>Improve our services and develop new features</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">3. Data Storage and Security</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Your data is stored securely using Firebase/Google Cloud infrastructure. We implement appropriate
              technical and organizational measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction.
            </p>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Passwords are encrypted using industry-standard methods. We never store your password in plain text.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">4. Data Sharing</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              We do not sell your personal information to third parties. We may share data in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 font-medium ml-4">
              <li><strong className="text-white font-black">Public Content:</strong> Content you mark as "public" is visible to all BoxBoxd users</li>
              <li><strong className="text-white font-black">Service Providers:</strong> We use Firebase/Google Cloud for hosting and data storage</li>
              <li><strong className="text-white font-black">Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">5. Your Rights</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 font-medium ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Delete your account at any time</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">6. Cookies and Tracking</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              We use cookies and similar technologies to maintain your session and improve your experience.
              You can control cookie settings through your browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">7. Children's Privacy</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              BoxBoxd is not intended for users under 13 years of age. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">8. Changes to This Policy</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">9. Contact Us</h2>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Email: <a href="mailto:privacy@boxboxd.com" className="text-racing-red hover:underline font-black">privacy@boxboxd.com</a>
            </p>
          </section>
        </Card>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
