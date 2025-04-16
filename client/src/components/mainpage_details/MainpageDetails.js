import React, { useEffect, useState } from "react";
import Navbar from "../navbar/Navbar";
import "./mainpagedetails.css";
import { useParams } from "react-router-dom";
import { getQuestionById } from "../../api/question";
import { pdfjs } from "react-pdf";
import { Document, Page } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const MainpageDetails = () => {
  const { postId } = useParams();
  const [question, setQuestion] = useState(null);
  const [test, setTest] = useState(null);
  const [pdfError, setPdfError] = useState({});
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // make an api call using the postId and map over the questions array
  function truncateText(text, limit) {
    if (text && text.length > limit) {
      return text.substring(0, limit) + "...";
    }
    return text;
  }
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
  function convertToNewUrl(originalUrl) {
    const prefix = "https://dsld.od.nih.gov/label/";
    const suffix = ".pdf";
    const id = originalUrl.substring(prefix.length);

    return `https://api.ods.od.nih.gov/dsld/s3/pdf/${id}${suffix}`;
  }

  useEffect(() => {
    const fetchQuestion = async () => {
      getQuestionById(postId)
        .then((res) => res.json())
        .then((data) => setQuestion(data));
    };
    fetchQuestion();
  }, []);

  // const [shouldReload, setShouldReload] = useState(true);

  // useEffect(() => {
  //     if (shouldReload) {
  //         // Reload the page when the component mounts
  //         window.location.reload();
  //         // Set shouldReload to false to prevent continuous reloads
  //         setShouldReload(false);
  //     }
  // }, [shouldReload]);

  return (
    <div className="mainpage_details">
      <Navbar />
      {question && (
        <>
          <div className="mainpage_details_top">
            <h1>Recommendations ({question.rec_list.length})</h1>
          </div>
          <div className="recommendation_container">
            {question.rec_list.map((d, index) => (
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
  );
};

export default MainpageDetails;
