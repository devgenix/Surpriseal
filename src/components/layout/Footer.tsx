import Link from "next/link";
import Container from "@/components/ui/Container";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#f3eae7] pt-16 pb-8">
      <Container>
        {/* Top Section */}
        <div className="flex flex-col gap-8 mb-12 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="size-10 text-primary flex items-center justify-center bg-primary/10 rounded-md">
                <span className="material-symbols-outlined text-[24px]">celebration</span>
              </div>
              <span className="text-lg font-bold text-[#1b110e]">Supriseal</span>
            </Link>
            <p className="text-sm text-[#97604e]">
              Crafting digital happiness, one click at a time.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-[#1b110e] mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-[#97604e]">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#f3eae7] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#97604e]">
            © {new Date().getFullYear()} Supriseal Inc. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Instagram */}
            <a
              href="#"
              className="text-[#97604e] hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  clipRule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 017.845 2.525c.636-.247 1.363-.416 2.427-.465C11.296 2.013 11.65 2 14.1 2h-.165zm-3.77 1.933c-2.368.108-3.085.666-3.567 1.916-.145.378-.236.786-.27 1.298-.035.53-.042 1.42-.042 3.65v.17c0 2.46.007 3.228.047 3.73.033.513.125.92.27 1.298.243.626.587 1.096 1.074 1.583.487.487.957.831 1.583 1.074.378.145.786.236 1.298.27.502.04 1.269.047 3.73.047h.17c2.23 0 3.12-.007 3.65-.042.513-.034.92-.125 1.298-.27.626-.243 1.096-.587 1.583-1.074.487-.487.831-.957 1.074-1.583.145-.378.236-.786.27-1.298.04-.502.047-1.269.047-3.73v-.17c0-2.23-.007-3.12-.042-3.65-.034-.513-.125-.92-.27-1.298-.243-.626-.587-1.096-1.074-1.583-.487-.487-.957-.831-1.583-1.074-.378-.145-.786-.236-1.298-.27-.53-.035-1.42-.042-3.65-.042v.042zm4.033 3.035a5.034 5.034 0 110 10.068 5.034 5.034 0 010-10.068zm0 1.776a3.258 3.258 0 100 6.516 3.258 3.258 0 000-6.516zm5.33-2.905a1.183 1.183 0 110 2.366 1.183 1.183 0 010-2.366z"
                  fillRule="evenodd"
                />
              </svg>
            </a>
            {/* Twitter / X */}
            <a
              href="#"
              className="text-[#97604e] hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
