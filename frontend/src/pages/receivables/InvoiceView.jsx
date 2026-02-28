import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";
import api from "../../services/apiClient";

const HOSPITAL_NAME = "HILLTOP HOSPITAL";
const HOSPITAL_ADDRESS = "P.O. BOX 111, KABWE";
const HOSPITAL_TEL = "Tel: +260 977 123456";

const fmt = (n) =>
  n > 0
    ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })
    : "";

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMethod, setShareMethod] = useState("email"); // 'email' or 'whatsapp'
  const [shareData, setShareData] = useState({ recipient: "", message: "" });
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/receivables/schemes/invoices/${id}`);
      setInvoiceData(response.data);

      // Check if user requested an auto-download from list view
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.get("download") === "true") {
        // Short delay to ensure DOM is fully painted
        setTimeout(() => {
          handleDownloadPDF(response.data.invoice.invoiceNumber);
        }, 500);
      } else if (queryParams.get("share") === "true") {
        setTimeout(() => {
          setShowShareModal(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async (forcedInvoiceNumber = null) => {
    try {
      const invNum =
        forcedInvoiceNumber || invoiceData?.invoice?.invoiceNumber || id;

      // Native backend download using creating an invisible anchor tag
      const response = await api.get(
        `/receivables/schemes/invoices/${id}/pdf`,
        { responseType: "blob" },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${invNum}.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading backend PDF:", error);
      alert("Failed to download invoice PDF from server.");
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    try {
      setSharing(true);
      const invNum = invoiceData?.invoice?.invoiceNumber || id;

      if (shareMethod === "whatsapp") {
        // WhatsApp Flow: Trigger backend auto-download, then redirect to wa.me
        await handleDownloadPDF();

        const waText = encodeURIComponent(
          shareData.message ||
            `Hello, please find your invoice ${invNum} attached.`,
        );
        const waUrl = `https://wa.me/${shareData.recipient.replace(/[^0-9+]/g, "")}?text=${waText}`;
        window.open(waUrl, "_blank");

        setShowShareModal(false);
        setTimeout(
          () =>
            alert(
              "The PDF has been downloaded. Please drag and drop it into the WhatsApp chat that just opened.",
            ),
          1000,
        );
      } else {
        // Email Flow: Backend automatically generates and attaches PDF
        await api.post(`/receivables/schemes/invoices/${id}/send`, {
          recipientEmail: shareData.recipient,
          message: shareData.message,
        });
        alert("Invoice sent successfully via email!");
        setShowShareModal(false);
      }
    } catch (error) {
      console.error("Error sharing invoice:", error);
      alert("Failed to share the invoice. Please check the network log.");
    } finally {
      setSharing(false);
    }
  };
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-gray-500 text-sm">Loading invoice...</p>
        </div>
      </div>
    );

  if (!invoiceData)
    return (
      <div className="p-12 text-center bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-600 font-medium">
          Invoice not found or session expired
        </p>
      </div>
    );

  const { invoice, rows, totals } = invoiceData;
  const { scheme } = invoice;

  // Aggregate service totals across all member rows
  const agg = (field) =>
    (rows || []).reduce((s, r) => s + (Number(r[field]) || 0), 0);

  const services = [
    { label: "Consultation", value: agg("consultation") },
    { label: "Nursing Care", value: agg("nursingCare") },
    { label: "Hospitalisation / Lodging", value: agg("lodging") },
    { label: "Ante Natal Care", value: agg("antenatal") },
    { label: "Normal Delivery / Post Natal", value: 0 },
    { label: "Surgery / Surgicals", value: agg("surgicals") },
    { label: "Anesthetic", value: 0 },
    { label: "Theater Fee", value: 0 },
    { label: "X-Ray / Radiology", value: agg("radiology") },
    { label: "Laboratory Examination", value: agg("laboratory") },
    { label: "Physiotherapy", value: agg("physio") },
    { label: "Medicines / Pharmacy", value: agg("pharmacy") },
    { label: "Miscellaneous / Sundries", value: agg("sundries") },
    { label: "Doctor's Round", value: agg("drRound") },
    { label: "Dental Surgery", value: agg("dental") },
    { label: "Food", value: agg("food") },
    { label: "Other", value: agg("other") },
  ];

  const grandTotal =
    totals?.grandTotal || services.reduce((s, r) => s + r.value, 0);
  const periodLabel = invoice.periodStart
    ? new Date(invoice.periodStart).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-gray-100 pb-20 animate-fade-in">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-gray-500">
              {scheme?.schemeName} — {periodLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => handleDownloadPDF()}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Invoice Paper */}
      <div
        className="max-w-3xl mx-auto mt-8 print:mt-0 print:max-w-none"
        ref={printRef}
      >
        <div
          className="bg-white text-black shadow-lg print:shadow-none p-10 print:p-6"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {/* ── HEADER ── */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "24px",
              borderBottom: "2px solid black",
              paddingBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "0.025em",
                margin: 0,
              }}
            >
              INVOICE / STATEMENT
            </p>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 900,
                letterSpacing: "0.05em",
                marginTop: "4px",
                textTransform: "uppercase",
                marginBottom: 0,
              }}
            >
              {HOSPITAL_NAME}
            </h1>
            <p
              style={{
                fontSize: "12px",
                marginTop: "4px",
                color: "#4b5563",
                margin: 0,
              }}
            >
              {HOSPITAL_ADDRESS}
            </p>
            <p style={{ fontSize: "12px", color: "#4b5563", margin: 0 }}>
              {HOSPITAL_TEL}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "4px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                No.&nbsp;
                <span
                  style={{
                    color: "#dc2626",
                    fontSize: "16px",
                    fontWeight: 900,
                  }}
                >
                  {invoice.invoiceNumber}
                </span>
              </span>
            </div>
          </div>

          {/* ── META GRID ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "16px",
              fontSize: "12px",
            }}
          >
            <div style={{ width: "48%" }}>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  INVOICE / STATEMENT No.:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontWeight: 600 }}>
                  Patient's name &amp; Address:
                </span>
                <div
                  style={{
                    borderBottom: "1px dotted #6b7280",
                    width: "100%",
                    marginTop: "2px",
                    paddingBottom: "2px",
                  }}
                >
                  {scheme?.schemeName}
                </div>
                <div
                  style={{
                    borderBottom: "1px dotted #6b7280",
                    width: "100%",
                    marginTop: "4px",
                    paddingBottom: "2px",
                  }}
                >
                  {scheme?.contactPerson || ""}
                </div>
                <div
                  style={{
                    borderBottom: "1px dotted #6b7280",
                    width: "100%",
                    marginTop: "4px",
                    paddingBottom: "2px",
                  }}
                >
                  &nbsp;
                </div>
              </div>
              <div style={{ display: "flex", marginTop: "4px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  Date Admitted:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  &nbsp;
                </span>
              </div>
            </div>
            <div style={{ width: "48%" }}>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  Date:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  {new Date().toLocaleDateString("en-GB")}
                </span>
              </div>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  Ward:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  &nbsp;
                </span>
              </div>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  Doctor:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  &nbsp;
                </span>
              </div>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  Date:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  &nbsp;
                </span>
              </div>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  File No.:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  &nbsp;
                </span>
              </div>
              <div style={{ display: "flex", marginBottom: "6px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    marginRight: "4px",
                  }}
                >
                  Date Discharged:
                </span>
                <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                  &nbsp;
                </span>
              </div>
            </div>
          </div>

          {/* ── BILLING TABLE ── */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              marginTop: "16px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th
                  style={{
                    border: "1px solid #000",
                    textAlign: "center",
                    padding: "8px 12px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    width: "66%",
                  }}
                >
                  DESCRIPTION
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    textAlign: "center",
                    padding: "8px 12px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    width: "17%",
                  }}
                >
                  CHARGES
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    textAlign: "center",
                    padding: "8px 12px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    width: "17%",
                  }}
                >
                  PAID ON THIS INVOICE
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {svc.label}:
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "6px 12px",
                      fontSize: "12px",
                      textAlign: "right",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmt(svc.value)}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "6px 12px",
                      fontSize: "12px",
                    }}
                  >
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {[
                { label: "DEPOSIT", value: null },
                { label: "TOTAL", value: grandTotal, bold: true },
                { label: "LESS PREVIOUS PAYMENT", value: null },
                { label: "AMOUNT OUTSTANDING", value: grandTotal, bold: true },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{ backgroundColor: row.bold ? "#f3f4f6" : "#ffffff" }}
                >
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: row.bold ? 900 : 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {row.label}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "6px 12px",
                      fontSize: "12px",
                      textAlign: "right",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.value != null ? fmt(row.value) : ""}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "6px 12px",
                      fontSize: "12px",
                    }}
                  >
                    &nbsp;
                  </td>
                </tr>
              ))}
            </tfoot>
          </table>

          {/* ── FOOTER ── */}
          <div style={{ marginTop: "24px", fontSize: "12px" }}>
            <div style={{ display: "flex", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                BALANCE DUE: To be paid immediately to Hospital Accountant
              </span>
            </div>
            <div style={{ display: "flex", marginBottom: "8px" }}>
              <span
                style={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  marginRight: "8px",
                }}
              >
                BALANCE OVERPAID:
              </span>
              <span style={{ borderBottom: "1px dotted #6b7280", flex: 1 }}>
                &nbsp;
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "16px",
              }}
            >
              <div>
                <div style={{ display: "flex", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      marginRight: "8px",
                    }}
                  >
                    SIGNED:
                  </span>
                  <span
                    style={{
                      borderBottom: "1px dotted #6b7280",
                      width: "192px",
                    }}
                  >
                    &nbsp;
                  </span>
                </div>
                <p style={{ color: "#6b7280", fontSize: "10px", margin: 0 }}>
                  Original: To Patient
                </p>
              </div>
              <div
                style={{
                  border: "1px solid black",
                  width: "96px",
                  height: "64px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "12px",
                }}
              >
                Stamp
              </div>
            </div>
          </div>

          {/* ── MEMBER BREAKDOWN (visible on screen, print-hidden for summary view) ── */}
          {rows && rows.length > 0 && (
            <div className="mt-10 print:hidden">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide border-b border-gray-200 pb-1">
                Member Billing Detail — {periodLabel}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 text-left font-bold">
                        Policy #
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-left font-bold">
                        Patient
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold">
                        Consult
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold">
                        Nursing
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold">
                        Lab
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold">
                        Radio
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold">
                        Dental
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold">
                        Pharmacy
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold">
                        Other
                      </th>
                      <th className="border border-gray-300 px-2 py-2 text-right font-bold bg-gray-200">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        style={{ pageBreakInside: "avoid" }}
                      >
                        <td className="border border-gray-200 px-2 py-1 font-mono text-gray-600">
                          {row.policyNumber || row.manNumber || "-"}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 font-medium">
                          {row.patientName}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">
                          {fmt(row.consultation)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">
                          {fmt(row.nursingCare)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">
                          {fmt(row.laboratory)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">
                          {fmt(row.radiology)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">
                          {fmt(row.dental)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">
                          {fmt(row.pharmacy)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right tabular-nums">
                          {fmt(row.other)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1 text-right font-bold bg-gray-100 tabular-nums">
                          {fmt(row.total)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-200 font-bold">
                      <td
                        colSpan="2"
                        className="border border-gray-300 px-2 py-1.5 text-right uppercase text-[10px] tracking-widest"
                      >
                        Grand Total
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                        {fmt(totals?.consultation)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                        {fmt(totals?.nursingCare)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                        {fmt(totals?.laboratory)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                        {fmt(totals?.radiology)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                        {fmt(totals?.dental)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                        {fmt(totals?.pharmacy)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                        {fmt(totals?.other)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums bg-gray-300">
                        {fmt(totals?.grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
                @media print {
                    @page { margin: 10mm; size: A4 portrait; }
                    body { background: white !important; color: black !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:mt-0 { margin-top: 0 !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    .print\\:p-6 { padding: 1.5rem !important; }
                }
            `}</style>
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4 pb-4 bg-black/50 backdrop-blur-sm animate-fade-in print:hidden overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Share Invoice</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="p-6 space-y-6">
              {/* Method Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-xl space-x-1">
                <button
                  type="button"
                  onClick={() => setShareMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${shareMethod === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setShareMethod("whatsapp")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${shareMethod === "whatsapp" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {shareMethod === "email"
                      ? "Recipient Email"
                      : "Recipient Phone Number"}
                  </label>
                  <input
                    type={shareMethod === "email" ? "email" : "tel"}
                    required
                    placeholder={
                      shareMethod === "email"
                        ? "billing@company.com"
                        : "+260 970000000"
                    }
                    value={shareData.recipient}
                    onChange={(e) =>
                      setShareData({ ...shareData, recipient: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {shareMethod === "whatsapp" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Must include country code (e.g., +260).
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message
                  </label>
                  <textarea
                    rows="3"
                    placeholder={
                      shareMethod === "whatsapp"
                        ? "Hello, please find your invoice attached..."
                        : "Optional message..."
                    }
                    value={shareData.message}
                    onChange={(e) =>
                      setShareData({ ...shareData, message: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  disabled={sharing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing || !shareData.recipient}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
                >
                  {sharing ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      {shareMethod === "email" ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      {shareMethod === "email" ? "Send Email" : "Open WhatsApp"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceView;
