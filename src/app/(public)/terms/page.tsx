import Container from "@/components/ui/Container";

export default function TermsPage() {
  return (
    <div className="py-12 md:py-20 bg-[#fcf9f8]">
      <Container>
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-12 rounded-3xl border border-[#f3eae7] shadow-sm">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1b110e] mb-8 leading-tight">Terms of Service</h1>
          
          <div className="prose prose-stone prose-lg text-[#97604e]">
            <p className="mb-6 font-medium text-[#1b110e]">Last Updated: February 22, 2026</p>
            
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using Supriseal, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our service.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">2. Description of Service</h2>
              <p>Supriseal provides a platform for creating interactive, structured celebration journeys. We reserve the right to modify or discontinue the service at any time.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">3. User Responsibilities</h2>
              <p>You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to use the service only for lawful purposes.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">4. Content Ownership</h2>
              <p>You retain all rights to the content you upload to Supriseal. By uploading content, you grant Supriseal a non-exclusive license to host and display that content as required to provide the service.</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">5. Limitation of Liability</h2>
              <p>Supriseal shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1b110e] mb-4">6. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact us at help@supriseal.com.</p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
