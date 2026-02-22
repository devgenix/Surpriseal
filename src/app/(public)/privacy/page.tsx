import Container from "@/components/ui/Container";

export default function PrivacyPage() {
  return (
    <div className="py-20 bg-[#fcf9f8]">
      <Container>
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl border border-[#f3eae7] shadow-sm">
          <h1 className="text-4xl font-bold text-[#1b110e] mb-8 leading-tight">Privacy Policy</h1>
          
          <div className="prose prose-stone prose-lg text-[#97604e]">
            <p className="mb-6 font-medium text-[#1b110e]">Last Updated: February 22, 2026</p>
            
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, create a celebration, or communicate with us. This includes your name, email address, and any media or messages you upload.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you about your account and our service.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">3. Data Security</h2>
              <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. We use encryption for sensitive data at rest and in transit.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">4. Sharing of Information</h2>
              <p>We do not share your personal information with third parties except as necessary to provide our service (e.g., payment processing via Stripe) or as required by law.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">5. Your Choices</h2>
              <p>You may update or delete your account information at any time by logging into your account settings. You can also contact us to request the permanent deletion of all your data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">6. Cookies</h2>
              <p>We use cookies to maintain your session and remember your preferences. You can disable cookies in your browser settings, but some features of the service may not function properly.</p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
