import React from "react";
import HeroBanner from "./HeroBanner";

const baseStyles = {
  paragraph: {
    fontSize: "0.95rem",
    lineHeight: 1.8,
    color: "#666666",
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "#2b2b2b",
    marginBottom: "0.75rem",
    marginTop: "1.5rem",
  },
  bulletList: {
    marginBottom: "1rem",
    paddingLeft: "1.2rem",
    color: "#666666",
    lineHeight: 1.8,
  },
};

const PrivacyPolicy = () => {
  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", color: "#555555" }}>
      <HeroBanner
        title="Privacy Policy"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <h1 style={{ fontWeight: 600, fontSize: "2rem", color: "#2b2b2b", marginBottom: "0.75rem" }}>
              Privacy Policy
            </h1>

            <p style={baseStyles.paragraph}><strong>Effective Date:</strong> 20/04/2026</p>

            <p style={baseStyles.paragraph}>
              At Gen1Eco, we value your privacy and are committed to protecting your personal information.
            </p>

            <h2 style={baseStyles.sectionTitle}>1. Information We Collect</h2>
            <p style={baseStyles.paragraph}>We may collect the following information:</p>
            <ul style={baseStyles.bulletList}>
              <li>Name, email address, phone number</li>
              <li>Shipping and billing address</li>
              <li>Payment details (processed securely via third-party gateways)</li>
              <li>Website usage data (cookies, IP address)</li>
            </ul>

            <h2 style={baseStyles.sectionTitle}>2. How We Use Your Information</h2>
            <p style={baseStyles.paragraph}>We use your information to:</p>
            <ul style={baseStyles.bulletList}>
              <li>Process and deliver orders</li>
              <li>Provide customer support</li>
              <li>Improve our products and website experience</li>
              <li>Send order updates, promotions (if opted in)</li>
            </ul>

            <h2 style={baseStyles.sectionTitle}>3. Payment Security</h2>
            <p style={baseStyles.paragraph}>
              All payments are processed through secure payment gateways. We do not store your card or sensitive payment information.
            </p>

            <h2 style={baseStyles.sectionTitle}>4. Sharing of Information</h2>
            <p style={baseStyles.paragraph}>We do not sell or rent your data. Information may be shared only with:</p>
            <ul style={baseStyles.bulletList}>
              <li>Logistics partners (for delivery)</li>
              <li>Payment gateways</li>
              <li>Legal authorities (if required)</li>
            </ul>

            <h2 style={baseStyles.sectionTitle}>5. Cookies</h2>
            <p style={baseStyles.paragraph}>
              We use cookies to enhance your browsing experience and improve website performance.
            </p>

            <h2 style={baseStyles.sectionTitle}>6. Your Rights</h2>
            <p style={baseStyles.paragraph}>
              You may request access, correction, or deletion of your personal data by contacting us.
            </p>

            <h2 style={baseStyles.sectionTitle}>7. Contact Us</h2>
            <p style={baseStyles.paragraph}>
              Email: info@gen1eco.com<br />
              Phone: 9217900925
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;