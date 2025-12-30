import mongoose from "mongoose";
import Invoice from "../models/invoiceModel.js";
import { getAuth } from "@clerk/express";
import path from "path";

const API_BASE = "http://localhost:4000";

/* -------------------- HELPERS -------------------- */

// ✅ FIXED computeTotals
function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  const subtotal = safe.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

// ✅ FIXED JSON.parse
function parseItemsField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
}

function isObjectIdString(val) {
  return typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val);
}

function uploadedFilesToUrls(req) {
  const urls = {};
  if (!req.files) return urls;

  const mapping = {
    logo: "logoDataUrl",
    stamp: "stampDataUrl",
    signature: "signatureDataUrl",
  };

  Object.keys(mapping).forEach((field) => {
    const arr = req.files[field];
    if (Array.isArray(arr) && arr[0]) {
      const filename =
        arr[0].filename || (arr[0].path && path.basename(arr[0].path));
      if (filename) urls[mapping[field]] = `${API_BASE}/uploads/${filename}`;
    }
  });

  return urls;
}

/* -------------------- CREATE INVOICE -------------------- */
export async function createInvoice(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const body = req.body || {};
    const items = parseItemsField(body.items);
    const taxPercent = Number(body.taxPercent || 0);
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    const invoice = await Invoice.create({
      owner: auth.userId,
      invoiceNumber: body.invoiceNumber || `INV-${Date.now()}`,
      issueDate: body.issueDate || new Date(),
      dueDate: body.dueDate,
      fromBusinessName: body.fromBusinessName,
      fromEmail: body.fromEmail,
      fromAddress: body.fromAddress,
      fromPhone: body.fromPhone,
      client: body.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: body.status || "draft",
      taxPercent,
      ...fileUrls,
      notes: body.notes,
    });

    return res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    console.error("CREATE INVOICE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* -------------------- GET ALL INVOICES -------------------- */
export async function getInvoices(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const query = { owner: auth.userId };

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 }) // ✅ FIXED
      .lean();

    return res.status(200).json({ success: true, data: invoices });
  } catch (err) {
    console.error("GET INVOICES ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* -------------------- GET INVOICE BY ID -------------------- */
export async function getInvoiceById(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const invoice = isObjectIdString(id)
      ? await Invoice.findById(id)
      : await Invoice.findOne({ invoiceNumber: id });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (String(invoice.owner) !== auth.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    console.error("GET INVOICE BY ID ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* -------------------- UPDATE INVOICE -------------------- */
export async function updateinvoice(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    // ✅ Handle BOTH ObjectId and invoiceNumber
    const query = isObjectIdString(id)
      ? { _id: id, owner: auth.userId }
      : { invoiceNumber: id, owner: auth.userId };

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Apply updates
    Object.assign(invoice, req.body);

    // ✅ Recalculate totals (VERY IMPORTANT)
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const taxPercent = Number(invoice.taxPercent || 0);

    const { subtotal, tax, total } = computeTotals(items, taxPercent);

    invoice.subtotal = subtotal;
    invoice.tax = tax;
    invoice.total = total;

    await invoice.save();

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    console.error("UPDATE INVOICE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


/* -------------------- DELETE INVOICE -------------------- */
export async function deleteInvoice(req, res) {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    // ✅ Handle BOTH ObjectId and invoiceNumber
    const query = isObjectIdString(id)
      ? { _id: id, owner: auth.userId }
      : { invoiceNumber: id, owner: auth.userId };

    const invoice = await Invoice.findOneAndDelete(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (err) {
    console.error("DELETE INVOICE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

