import express from "express";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoices,
  updateinvoice,
} from "../controllers/invoiceController.js";

const invoiceRouter = express.Router();

invoiceRouter.get("/", getInvoices);
invoiceRouter.get("/:id", getInvoiceById);
invoiceRouter.post("/", createInvoice);
invoiceRouter.put("/:id", updateinvoice);
invoiceRouter.delete("/:id", deleteInvoice);

export default invoiceRouter;
