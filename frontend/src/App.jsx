import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AppShell from "./components/AppShell";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import CreateInvoie from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";
import InvoicePreview from "./components/InvoicePreview";
import CreateInvoice from "./pages/CreateInvoice";
import BusinessProfile from "./pages/BusinessProfile";

// ✅ Proper Clerk Protected Wrapper
const ClerkProtected = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const App = () => {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Home />} />

        {/* Protected App Routes */}
        <Route
          path="/app"
          element={
            <ClerkProtected>
              <AppShell />
            </ClerkProtected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="invoices" element={<Invoices/>}/>
          <Route path="invoices/new" element={<CreateInvoice/>}/>
          <Route path="invoices/:id" element={<InvoicePreview/>}/>
          <Route path="invoices/:id/preview" element={<InvoicePreview/>}/>
          <Route path="invoices/:id/edit" element={<CreateInvoice/>}/>
         


          <Route path="create-invoice" element={<CreateInvoie/>}/>
          <Route path="business" element={<BusinessProfile/>}/>
        </Route>
      </Routes>
    </div>
  );
};

export default App;
