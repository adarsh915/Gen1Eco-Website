import React from "react";
import HeroBanner from "./HeroBanner";

const RefundPolicy = () => {
  return (
    <>
      <HeroBanner
        title="Refund Policy"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Refund Policy" },
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
              Refund Policy
            </h1>

            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px" }}>
              <strong>Effective Date:</strong> 20/04/2026
            </p>
            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px" }}>
              We aim to ensure customer satisfaction with every purchase.
            </p>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>1. Eligibility for Refund</h5>
            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px", marginBottom: "10px" }}>
              Refunds are applicable if:
            </p>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Product is damaged or defective</li>
              <li className="mb-2">Wrong product delivered</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>2. Refund Process</h5>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Request within 48 hours of delivery</li>
              <li className="mb-2">Provide photos/videos as proof</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>3. Refund Timeline</h5>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Approved refunds are processed within 5–7 business days</li>
              <li className="mb-2">Amount will be credited to original payment method</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3" style={{ color: "#2b2b2b" }}>4. Non-Refundable Cases</h5>
            <ul className="text-muted ps-3" style={{ lineHeight: "30px", fontSize: "15px" }}>
              <li className="mb-2">Used products</li>
              <li className="mb-2">Products damaged by customer</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default RefundPolicy;
