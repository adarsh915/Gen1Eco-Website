import React from "react";

const styles = `
  .beauty_add_area {
    padding: 0 0 60px;
    background: #fff;
  }

  .beauty-box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .col-md-6 {
    flex: 0 0 50%;
    max-width: 50%;
    padding: 0 15px;
    box-sizing: border-box;
  }

  .container-fluid {
    width: 100%;
    max-width: 1415px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    margin-right: -15px;
    margin-left: -15px;
  }

  .mt_70 {
    margin-top: 55px;
  }

  /* Same size box for image & video */
  .media-box {
    width: 100%;
    height: 320px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    background: #000;
    transition: 0.4s ease;
  }

  /* Image & Video same fit */
  .media-box img,
  .media-box video {
    width: 100%;
    height: 100%;
    object-fit: fill;
    display: block;
  }

  .media-box:hover {
    transform: translateY(-6px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.18);
  }

  /* Responsive for iPad */
  @media (max-width: 1024px) {
    .beauty_add_area {
      padding: 0 0 0px;
    }
    
    .col-md-6 {
      flex: 0 0 100%;
      max-width: 100%;
      margin-bottom: 40px;
    }

    .col-md-6:last-child {
      margin-bottom: 0;
    }

    .media-box {
      height: auto;
    }
  }

  /* Responsive for mobile */
  @media (max-width: 768px) {
    .beauty_add_area {
      padding: 40px 0 0px;
    }
  }
`;

export default function BeautyAddArea() {
  return (
    <>
      <style>{styles}</style>
      <section className="beauty_add_area">
        <div className="container-fluid">
          <div className="row align-items-center beauty-box">
            <div className="col-md-6">
              <div className="media-box">
                <img src="../images/video-ban.png" alt="" />
              </div>
            </div>
            <div className="col-md-6">
              <div className="media-box">
                <video autoPlay loop muted controls>
                  <source src="../images/video.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}