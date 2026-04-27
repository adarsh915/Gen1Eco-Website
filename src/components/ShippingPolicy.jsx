import React from "react";
import HeroBanner from "./HeroBanner";

const ShippingPolicy = () => {
  return (
    <>
      <HeroBanner
        title="Shipping Policy"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shipping Policy" },
        ]}
      />


      <div className="container py-5">

        <div className="row justify-content-flex-start">
          <div className="col-lg-10 col-md-12">

            <h1 className=" mb-4"
              style={{
                fontWeight: "500",
                fontSize: "32px",
              }}>
              Shipping Policy</h1>

            <p className="text-muted" style={{ marginTop: "20px", fontSize: "15px", lineHeight: "30px" }}>
              <strong>Effective Date:</strong> 20/04/2026
            </p>

            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px" }}>
              At Gen1Eco, we aim to deliver eco-friendly products quickly and safely.
            </p>

            <h5 className="fw-semibold mt-4 mb-3">1. Order Processing</h5>
            <ul className="text-muted ps-3" style={{ fontSize: "15px", lineHeight: "30px" }}>
              <li className="mb-2">Orders are processed within 1–3 business days</li>
              <li className="mb-2">Orders are not processed on Sundays or public holidays</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3">2. Shipping Time</h5>
            <ul className="text-muted ps-3" style={{ fontSize: "15px", lineHeight: "30px" }}>
              <li className="mb-2">Delivery within India: 3–7 business days</li>
              <li className="mb-2">Remote locations may take longer</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3">3. Shipping Charges</h5>
            <ul className="text-muted ps-3" style={{ fontSize: "15px", lineHeight: "30px" }}>
              <li className="mb-2">Free shipping (if applicable) OR</li>
              <li className="mb-2">Calculated at checkout</li>
            </ul>

            <h5 className="fw-semibold mt-4 mb-3">4. Tracking</h5>
            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px" }}>
              Once your order is shipped, you will receive a tracking link via email/SMS.
            </p>

            <h5 className="fw-semibold mt-4 mb-3">5. Delays</h5>
            <p className="text-muted" style={{ fontSize: "15px", lineHeight: "30px" }}>
              Delays may occur due to:
            </p>
            <ul className="text-muted ps-3" style={{ fontSize: "15px", lineHeight: "30px" }}>
              <li className="mb-2">Weather conditions</li>
              <li className="mb-2">Courier issues</li>
              <li className="mb-2">High order volume</li>
            </ul>

          </div>
        </div>
      </div>
    </>
  );
};


export default ShippingPolicy;
