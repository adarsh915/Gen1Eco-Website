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

const TermsAndConditions = () => {
  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", color: "#555555" }}>
      <HeroBanner
        title="Terms & Conditions"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Terms & Conditions" },
        ]}
      />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <h1 style={{ fontWeight: 600, fontSize: "2rem", color: "#2b2b2b", marginBottom: "0.75rem" }}>
              Terms & Conditions
            </h1>

            <p style={baseStyles.paragraph}><strong>Effective Date:</strong> 20/04/2026</p>

            <p style={baseStyles.paragraph}>
              Welcome to Gen1Eco. By using our website, you agree to the following terms:
            </p>

            <h2 style={baseStyles.sectionTitle}>1. Use of Website</h2>
            <p style={baseStyles.paragraph}>
              You agree to use this website only for lawful purposes.
            </p>

            <h2 style={baseStyles.sectionTitle}>2. Product Information</h2>
            <p style={baseStyles.paragraph}>
              We strive to ensure all product details are accurate. However, minor variations may occur.
            </p>

            <h2 style={baseStyles.sectionTitle}>3. Pricing</h2>
            <ul style={baseStyles.bulletList}>
              <li>Prices are subject to change without notice</li>
              <li>We reserve the right to cancel orders due to pricing errors</li>
            </ul>

            <h2 style={baseStyles.sectionTitle}>4. Intellectual Property</h2>
            <p style={baseStyles.paragraph}>
              All content on this website (logo, images, text) belongs to Gen1Eco and cannot be used without permission.
            </p>

            <h2 style={baseStyles.sectionTitle}>5. Limitation of Liability</h2>
            <p style={baseStyles.paragraph}>Gen1Eco is not liable for:</p>
            <ul style={baseStyles.bulletList}>
              <li>Indirect or incidental damages</li>
              <li>Delays beyond our control</li>
            </ul>

            <h2 style={baseStyles.sectionTitle}>6. Governing Law</h2>
            <p style={baseStyles.paragraph}>
              These terms are governed by the laws of India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
