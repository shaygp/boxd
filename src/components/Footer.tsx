import { Button } from "@/components/ui/button";
import { Apple } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="hidden sm:block border-t border-gray-800/50 bg-gradient-to-b from-black to-gray-950 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-racing-red rounded flex items-center justify-center">
                <span className="text-white font-black text-lg">B</span>
              </div>
              <h3 className="text-2xl font-black tracking-tighter">
                <span className="text-white">BOX</span>
                <span className="text-racing-red">BOXD</span>
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Track every race. Rate every GP. Join the ultimate F1 community.
            </p>
          </div>

          {/* App Download */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider">
              Get the App
            </h4>
            <a
              href="https://apps.apple.com/us/app/boxboxd/id6754217984"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black font-bold gap-2 px-6 py-6 transition-all hover:scale-105">
                <Apple className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-[10px] leading-none">Download on the</div>
                  <div className="text-sm leading-none mt-0.5">App Store</div>
                </div>
              </Button>
            </a>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-gray-500 uppercase tracking-wider">
              Follow Us
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://twitter.com/Box_Boxd"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-racing-red transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="font-bold">@Box_Boxd</span>
              </a>
              <a
                href="https://instagram.com/Box.Boxd"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:via-pink-600 group-hover:to-orange-500 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                  </svg>
                </div>
                <span className="font-bold">@Box.Boxd</span>
              </a>
              <a
                href="https://tiktok.com/@BoxBoxdApp"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center group-hover:bg-black transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <span className="font-bold">@BoxBoxdApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} BoxBoxd. Not affiliated with Formula 1®
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy-policy" className="text-gray-500 hover:text-racing-red transition-colors">
              Privacy
            </a>
            <a href="/terms-of-service" className="text-gray-500 hover:text-racing-red transition-colors">
              Terms
            </a>
            <a href="/support" className="text-gray-500 hover:text-racing-red transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
