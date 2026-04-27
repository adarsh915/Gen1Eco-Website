import React from "react";
import HeroBanner from "./HeroBanner";

const ReturnPolicyPage = () => {
  return (
    <>
      <HeroBanner
        title="Return Policy"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Return Policy" },
        ]}
      />

      <div className="container py-5">
        <div className="row">
          <div className="col-lg-10 col-md-12">
            <h1
              style={{
                fontWeight: 500,
                fontSize: "32px",
                color: "#2b2b2b",
                marginBottom: "1.25rem",
              }}
            >
              Return Policy
            </h1>

            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px" }}>
              <strong>Effective Date:</strong> 20/04/2026
            </p>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>1. Return Eligibility</h5>
            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px", marginBottom: "10px" }}>
              You can request a return if:
            </p>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Product is damaged</li>
              <li className="mb-2">Incorrect item delivered</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>2. Return Window</h5>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Within 48 hours of delivery</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>3. Return Process</h5>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Contact support with order details</li>
              <li className="mb-2">Our team will arrange pickup (if applicable)</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>4. Conditions</h5>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Product must be unused</li>
              <li className="mb-2">Must be in original packaging</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnPolicyPage;
