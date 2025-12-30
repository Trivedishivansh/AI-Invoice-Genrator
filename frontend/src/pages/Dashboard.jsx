import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { dashboardStyles } from "../assets/dummyStyles";

// Components
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";

// Icons
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const FileTextIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const API_BASE = "http://localhost:4000";

/* -------------------- HELPERS -------------------- */
const currencyFmt = (amount = 0, currency = "INR") => {
  try {
    const value = Number(amount);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(isNaN(value) ? 0 : value);
  } catch {
    return `${currency} ${amount}`;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getClientName = (inv) => inv?.clientName || inv?.recipientName || "Unknown Client";
const getClientInitial = (inv) => getClientName(inv).charAt(0).toUpperCase();

/* -------------------- COMPONENT -------------------- */
const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const [storedInvoices, setStoredInvoices] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const obtainToken = useCallback(async () => {
    try {
      return await getToken();
    } catch (err) {
      console.error("Token error:", err);
      return null;
    }
  }, [getToken]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await obtainToken();
      if (!token) throw new Error("Authentication token missing");

      const res = await fetch(`${API_BASE}/api/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch invoices");
      setStoredInvoices(json.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [obtainToken]);

  const fetchBusinessProfile = useCallback(async () => {
    try {
      const token = await obtainToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/businessProfile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return;
      const json = await res.json();
      setBusinessProfile(json?.data || null);
    } catch (err) {
      console.warn("Profile fetch failed:", err);
    }
  }, [obtainToken]);

  useEffect(() => {
    if (isSignedIn) {
      fetchInvoices();
      fetchBusinessProfile();
    }
  }, [isSignedIn, fetchInvoices, fetchBusinessProfile]);

  /* -------------------- KPI & LIST LOGIC -------------------- */
  const HARD_RATES = { USD: 83 };
  
  const toINR = (amt, curr) => {
    const val = Number(amt) || 0;
    return curr === "USD" ? val * HARD_RATES.USD : val;
  };

  const kpis = useMemo(() => {
    let paidTotal = 0;
    let unpaidTotal = 0;
    let paidCount = 0;

    storedInvoices.forEach((inv) => {
      // 1. Force convert to Number to ensure math works
      const amt = toINR(inv.total, inv.currency);
      
      // 2. Clean status for comparison
      const status = (inv.status || "").toString().trim().toLowerCase();

      
      console.log(`Checking Invoice: ${inv._id} | Status: ${status} | Amount: ${amt}`);

      if (status === "paid") {
        paidTotal += amt;
        paidCount++;
      } else {
        unpaidTotal += amt;
      }
    });

    const totalInvoices = storedInvoices.length;
    const totalAmount = paidTotal + unpaidTotal;

    return {
      totalInvoices,
      totalPaid: paidTotal,
      totalUnpaid: unpaidTotal,
      paidCount,
      paidPercentage: totalAmount > 0 ? (paidTotal / totalAmount) * 100 : 0,
    };
  }, [storedInvoices]);

  const recent = useMemo(() => [...storedInvoices].reverse().slice(0, 5), [storedInvoices]);

  const openInvoice = (inv) =>
    navigate(`/app/invoices/${inv.id}`, { state: { invoice: inv } });

  return (
    <div className={dashboardStyles.pageContainer}>
      <div className={dashboardStyles.headerContainer}>
        <h1 className={dashboardStyles.headerTitle}>Dashboard Overview</h1>
        <p className={dashboardStyles.headerSubtitle}>
          Track your invoicing performance and business insights
        </p>
      </div>

      {loading && <div className="p-6 text-gray-500">Loading your data...</div>}

      {error && (
        <div className="p-6">
          <p className="text-red-600 mb-3 font-medium">Error: {error}</p>
          <button
            onClick={fetchInvoices}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={dashboardStyles.kpiGrid}>
            <KpiCard
              title="Total Invoices"
              value={kpis.totalInvoices}
              hints="Active invoices"
              iconType="document"
               trend={8.5}
            />
            <KpiCard
              title="Total Paid"
              value={currencyFmt(kpis.totalPaid, "INR")}
              hints="Received Amount (INR)"
              iconType="revenue"
              trend={12.2}
            />
            <KpiCard
              title="Total Unpaid"
              value={currencyFmt(kpis.totalUnpaid, "INR")}
              hints="Outstanding Balance (INR)"
              iconType="clock"
              trend={-3.1}
            />
          </div>

          <div className={dashboardStyles.mainGrid}>
            <div className={dashboardStyles.sidebarColumn}>
              <div className={dashboardStyles.quickStatsCard}>
                <h3 className={dashboardStyles.quickStatsTitle}>Quick stats</h3>
                <div className="space-y-3">
                  <div className={dashboardStyles.quickStatsRow}>
                    <span>Paid Rate</span>
                    <span>
                      {kpis.totalInvoices > 0
                        ? ((kpis.paidCount / kpis.totalInvoices) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className={dashboardStyles.quickStatsRow}>
                    <span>Avg. Invoice</span>
                    <span>
                      {currencyFmt(
                        kpis.totalInvoices > 0
                          ? (kpis.totalPaid + kpis.totalUnpaid) / kpis.totalInvoices
                          : 0
                      )}
                    </span>
                  </div>
                  <div className={dashboardStyles.quickStatsRow}>
                    <span>Collection Eff.</span>
                    <span>{kpis.paidPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className={dashboardStyles.cardContainer}>
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className={dashboardStyles.quickActionsContainer}>
                    <button
                      onClick={() => navigate("/app/create-invoice")}
                      className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionBlue}`}
                    >
                      <div className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconBlue}`}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14m-7-7h14" />
                        </svg>
                      </div>
                      <span className={dashboardStyles.quickActionText}>Create Invoice</span>
                    </button>

                    <button
                      onClick={() => navigate("/app/invoices")}
                      className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}
                    >
                      <div className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
                        </svg>
                      </div>
                      <span className={dashboardStyles.quickActionText}>View All</span>
                    </button>

                    <button onClick={() => navigate("/app/business")} className={`${dashboardStyles.quickActionButton} ${dashboardStyles.quickActionGray}`}>
                      <div className={`${dashboardStyles.quickActionIconContainer} ${dashboardStyles.quickActionIconGray}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className={dashboardStyles.quickActionText}>Business Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.contentColumn}>
              <div className={dashboardStyles.cardContainerOverflow}>
                <div className={dashboardStyles.tableHeader}>
                  <div className={dashboardStyles.tableHeaderContent}>
                    <div>
                      <h3 className={dashboardStyles.tableTitle}>Recent Invoices</h3>
                      <p className={dashboardStyles.tableSubtitle}>Latest 5 invoices</p>
                    </div>
                    <button onClick={() => navigate("/app/invoices")} className={dashboardStyles.tableActionButton}>
                      View All
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={dashboardStyles.tableContainer}>
                  <table className={dashboardStyles.table}>
                    <thead>
                      <tr className={dashboardStyles.tableHead}>
                        <th className={dashboardStyles.tableHeaderCell}>Client & ID</th>
                        <th className={dashboardStyles.tableHeaderCell}>Amount</th>
                        <th className={dashboardStyles.tableHeaderCell}>Status</th>
                        <th className={dashboardStyles.tableHeaderCell}>Due Date</th>
                        <th className={dashboardStyles.tableHeaderCell}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={dashboardStyles.tableBody}>
                      {recent.map((inv) => (
                        <tr key={inv.id} className={dashboardStyles.tableRow} onClick={() => openInvoice(inv)}>
                          <td className={dashboardStyles.tableCell}>
                            <div className="flex items-center gap-3">
                              <div className={dashboardStyles.clientAvatar}>{getClientInitial(inv)}</div>
                              <div>
                                <div className={dashboardStyles.clientInfo}>{getClientName(inv)}</div>
                                <div className={dashboardStyles.clientSubInfo}>{inv.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className={dashboardStyles.tableCell}>
                            <div className={dashboardStyles.amountCell}>{currencyFmt(inv.amount, inv.currency)}</div>
                          </td>
                          <td className={dashboardStyles.tableCell}>
                            <StatusBadge status={inv.status} size="default" showIcon={true} />
                          </td>
                          <td className={dashboardStyles.tableCell}>
                            <div className={dashboardStyles.dateCell}>{formatDate(inv.dueDate)}</div>
                          </td>
                          <td className={dashboardStyles.tableCell}>
                            <div className="text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); openInvoice(inv); }}
                                className={dashboardStyles.actionButton}
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {recent.length === 0 && !loading && (
                        <tr>
                          <td colSpan="5" className={dashboardStyles.emptyState}>
                            <div className={dashboardStyles.emptyStateText}>
                              <FileTextIcon className={dashboardStyles.emptyStateIcon} />
                              <div className={dashboardStyles.emptyStateMessage}>No invoices yet</div>
                              <button onClick={() => navigate("/app/create-invoice")} className={dashboardStyles.emptyStateAction}>
                                Create your First Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;