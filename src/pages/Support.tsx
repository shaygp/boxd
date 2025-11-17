import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, HelpCircle, FileText, Shield } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 max-w-4xl">
        <div className="mb-8">
          <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-2">
            <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">HELP CENTER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-4">SUPPORT</h1>
          <p className="text-base sm:text-lg text-gray-300 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            We're here to help! Get support for BoxBoxd
          </p>
        </div>

        <div className="space-y-6">
          {/* Contact Methods */}
          <Card className="p-6 space-y-6 border-2 border-red-900/40 bg-black/90 backdrop-blur-sm">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Contact Us</h2>
              <p className="text-sm sm:text-base text-gray-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Choose the best way to reach our support team
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="mailto:support@boxboxd.app"
                className="flex items-start gap-4 p-4 rounded-lg border-2 border-red-900/40 bg-black/60 hover:border-racing-red transition-colors"
              >
                <div className="p-2 rounded-full bg-racing-red/20 border border-racing-red/40">
                  <Mail className="w-5 h-5 text-racing-red" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-wider mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Email Support</h3>
                  <p className="text-sm text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">support@boxboxd.app</p>
                  <p className="text-xs text-gray-400 mt-1 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Response within 24-48 hours</p>
                </div>
              </a>

              <a
                href="https://twitter.com/boxboxdapp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-lg border-2 border-red-900/40 bg-black/60 hover:border-racing-red transition-colors"
              >
                <div className="p-2 rounded-full bg-racing-red/20 border border-racing-red/40">
                  <MessageCircle className="w-5 h-5 text-racing-red" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-wider mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Social Media</h3>
                  <p className="text-sm text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">@boxboxdapp</p>
                  <p className="text-xs text-gray-400 mt-1 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Follow us for updates</p>
                </div>
              </a>
            </div>
          </Card>

          {/* FAQ */}
          <Card className="p-6 space-y-6 border-2 border-red-900/40 bg-black/90 backdrop-blur-sm">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 flex items-center gap-2 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                <HelpCircle className="w-6 h-6 text-racing-red" />
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">How do I log a race?</h3>
                <p className="text-sm text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Click the "Log" button in the header, search for the race you watched, add your rating and review, then save.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">How do I change my profile picture?</h3>
                <p className="text-sm text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Go to your Profile, click "Edit Profile", then click "Upload Photo" to select or take a photo.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Can I export my data?</h3>
                <p className="text-sm text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Yes! Go to Settings → Data & Privacy → Export My Data to download all your race logs, reviews, and lists.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">How do I delete my account?</h3>
                <p className="text-sm text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Go to Settings → Danger Zone → Delete Account. This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Is my data secure?</h3>
                <p className="text-sm text-gray-300 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Yes, we use industry-standard security measures to protect your data. Read our Privacy Policy for more details.
                </p>
              </div>
            </div>
          </Card>

          {/* Resources */}
          <Card className="p-6 space-y-6 border-2 border-red-900/40 bg-black/90 backdrop-blur-sm">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Resources</h2>
            </div>

            <div className="space-y-3">
              <a
                href="/privacy-policy"
                className="flex items-center gap-3 p-3 rounded-lg border border-red-900/40 bg-black/40 hover:bg-racing-red/20 hover:border-racing-red transition-colors"
              >
                <Shield className="w-5 h-5 text-racing-red" />
                <span className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Privacy Policy</span>
              </a>

              <a
                href="/terms-of-service"
                className="flex items-center gap-3 p-3 rounded-lg border border-red-900/40 bg-black/40 hover:bg-racing-red/20 hover:border-racing-red transition-colors"
              >
                <FileText className="w-5 h-5 text-racing-red" />
                <span className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Terms of Service</span>
              </a>
            </div>
          </Card>

          {/* Version Info */}
          <div className="text-center text-sm text-gray-400 py-4 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <p>BoxBoxd v1.0.0</p>
            <p className="mt-1">© 2025 BoxBoxd. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;
