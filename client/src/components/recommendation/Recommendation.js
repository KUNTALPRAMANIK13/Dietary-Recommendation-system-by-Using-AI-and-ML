import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@mui/material";

import Navbar from "../navbar/Navbar";
import "./recommendation.css";
import boy from "../../assets/images/boy.svg";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { useNavigate } from "react-router-dom";
import {
  getRecommendationAPIMethod,
  updateQuestionAPIMethod,
} from "../../api/question";
import { Document, Page, pdfjs } from "react-pdf";
import Loader from "../loader/Loader";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const Recommendation = () => {
  const [recommendation, setRecommendation] = useState(null);
  const [recList, setRecList] = useState([]); // top 10 recommendation
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState({});
  const { questionId, age, description } = useParams();
  const navigate = useNavigate();

  function truncateText(text, limit) {
    if (text && text.length > limit) {
      return text.substring(0, limit) + "...";
    }
    return text;
  }

  function convertToNewUrl(originalUrl) {
    const prefix = "https://dsld.od.nih.gov/label/";
    const suffix = ".pdf";
    const id = originalUrl.substring(prefix.length);

    return `https://api.ods.od.nih.gov/dsld/s3/pdf/${id}${suffix}`;
  }

  const pdfUrl = "https://api.ods.od.nih.gov/dsld/s3/pdf/14861.pdf";

  useEffect(() => {
    getRecommendationAPIMethod(age, description)
      .then((response) => response.json())
      .then((data) => {
        setRecommendation(data);
        if (data !== null && data.data !== undefined) {
          setRecList(data.data.slice(0, 10));
        }
      });
  }, []);

  const handleUpdateQuestion = () => {
    const rec_list = {
      rec_list: recList,
    };
    updateQuestionAPIMethod(questionId, rec_list)
      .then((response) => {
        if (response.ok) {
          console.log("Recommendation record has been saved.");
        } else {
          console.log("Error saving recommendation.");
        }
      })
      .catch((err) => {
        console.error("Error when saving recommendation:", err);
      });
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function onDocumentLoadError(error, id) {
    console.error("PDF failed to load:", error);
    setPdfError((prev) => ({ ...prev, [id]: true }));
  }

  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  return (
    <div className="recommendation">
      <Navbar />
      <div
        className="to_mainpage"
        onClick={() => {
          handleUpdateQuestion();
          navigate("/mainpage");
        }}
      >
        <KeyboardBackspaceIcon />
        <div>Save & Exit</div>
      </div>
      <div className="recommendation_outer">
        {console.log("reclist?: ", recList)}
        {recList.length == 0 && (
          <>
            <h1 className="loading_title">Collecting results...</h1>
            <p className="loading_subtext">(This may take up to 10 seconds)</p>
            <Loader />
          </>
        )}
        {recList.length != 0 && (
          <>
            <h1>Recommendations ({recList.length})</h1>
            <div className="recommendation_container">
              {recList.map((d, index) => (
                <div className="recommendation_inner" key={index}>
                  <div className="recommendation_object">
                    {pdfError[d[1]] ? (
                      <div className="pdf-error">
                        <h3>Product Information</h3>
                        <div className="pdf-content">
                          <p>
                            <strong>Name:</strong> {d[2]}
                          </p>
                          <p>
                            <strong>Brand:</strong> {d[3]}
                          </p>
                          <p>
                            <strong>Form:</strong> {d[8]}
                          </p>
                          <p>
                            <strong>Description:</strong>{" "}
                            {truncateText(d[13], 200)}
                          </p>
                          <div className="pdf-ingredients">
                            <strong>Ingredients:</strong>{" "}
                            {truncateText(d[14], 200)}
                          </div>
                        </div>
                        <a
                          href={d[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-source-btn"
                        >
                          View Source
                        </a>
                      </div>
                    ) : (
                      <div className="pdf-container">
                        <Document
                          file={d[0]}
                          onLoadSuccess={onDocumentLoadSuccess}
                          onLoadError={(error) =>
                            onDocumentLoadError(error, d[1])
                          }
                          loading={<p>Loading PDF...</p>}
                        >
                          <Page
                            pageNumber={pageNumber}
                            width={320}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </Document>
                        {numPages && (
                          <div className="pdf-controls">
                            <button
                              disabled={pageNumber <= 1}
                              onClick={previousPage}
                              className="pdf-btn"
                            >
                              Prev
                            </button>
                            <span>
                              Page {pageNumber} of {numPages}
                            </span>
                            <button
                              disabled={pageNumber >= numPages}
                              onClick={nextPage}
                              className="pdf-btn"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Recommendation;
