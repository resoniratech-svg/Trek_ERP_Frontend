import { Routes, Route } from "react-router-dom";

// Layouts
import DashboardLayout from "../layouts/DashboardLayout";

// Auth / Public pages
import Landing from "../pages/common/Landing";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Unauthorized from "../pages/common/Unauthorized";

// Route guard
import ProtectedRoute from "./ProtectedRoute";

// Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import Settings from "../pages/admin/Settings";
import AccountsDashboard from "../pages/accounts/AccountsDashboard";
import PMDashboard from "../pages/pm/PMDashboard";
import Users from "../pages/admin/Users";
import CreateUser from "../pages/admin/CreateUser";

import Permissions from "../pages/admin/Permissions";
import EditUser from "../pages/admin/EditUser";

import Projects from "../pages/pm/Projects";
import CreateProject from "../pages/pm/CreateProject";
import EditProject from "../pages/pm/EditProject";
import Jobs from "../pages/pm/Jobs";
import CreateJob from "../pages/pm/CreateJob";
import JobDetails from "../pages/pm/JobDetails";
import JobDocuments from "../pages/pm/JobDocuments";

import Clients from "../pages/admin/Clients";
import CreateClient from "../pages/admin/CreateClient";
import ClientDetails from "../pages/admin/ClientDetails";
import EditClient from "../pages/admin/EditClient";
import AdminPROTracking from "../pages/admin/AdminPROTracking";

import BOQ from "../pages/pm/BOQ";
import CreateBOQ from "../pages/pm/CreateBOQ";
import BOQDetails from "../pages/pm/BOQDetails";
import Quotations from "../pages/pm/Quotations";
import CreateQuotation from "../pages/pm/CreateQuotation";
import QuotationDetails from "../pages/pm/QuotationDetails";

import Proposals from "../pages/admin/Proposals";
import CreateProposal from "../pages/admin/CreateProposal";
import ProposalDetails from "../pages/admin/ProposalDetails";

import Invoices from "../pages/pm/Invoices";
import CreateInvoice from "../pages/pm/CreateInvoice";
import InvoiceDetails from "../pages/accounts/InvoiceDetails";
import Payments from "../pages/accounts/Payments";
import Expenses from "../pages/accounts/Expenses";
import CreateExpense from "../pages/accounts/CreateExpense";
import ExpenseDetails from "../pages/accounts/ExpenseDetails";

import ProfitLoss from "../pages/accounts/ProfitLoss";
import BalanceSheet from "../pages/accounts/BalanceSheet";
import FinancialReports from "../pages/accounts/FinancialReports";
import Receipts from "../pages/accounts/Receipts";
import CreditRequest from "../pages/accounts/CreditRequest";
import CreditRequests from "../pages/accounts/CreditRequests";
import Ledger from '../pages/accounts/Ledger';
import CreditControl from "../pages/accounts/CreditControl";

import Products from "../pages/inventory/Products";
import CreateProduct from "../pages/inventory/CreateProduct";
import InventoryDashboard from "../pages/inventory/InventoryDashboard";
import InventoryMovements from "../pages/inventory/InventoryMovements";
import CreateStockMovement from "../pages/inventory/CreateStockMovement";

import ClientDashboard from "../pages/client_portal/ClientDashboard";
import ClientProjects from "../pages/client_portal/ClientProjects";
import ClientBOQ from "../pages/client_portal/ClientBOQ";
import ClientBilling from "../pages/client_portal/ClientBilling";
import ClientQuotations from "../pages/client_portal/ClientQuotations";
import ClientDocuments from "../pages/client_portal/ClientDocuments";
import ClientPROServices from "../pages/client_portal/ClientPROServices";
import ClientSupport from "../pages/client_portal/ClientSupport";
import ClientCreditRequests from "../pages/client_portal/ClientCreditRequests";
// ClientProfile is now superseded by MyProfile

import LowStock from "../pages/inventory/LowStock";
import ProfitReport from "../pages/inventory/ProfitReport";
import PurchaseOrders from "../pages/inventory/PurchaseOrders";
import SalesOrders from "../pages/inventory/SalesOrders";
import DayWiseInventory from "../pages/inventory/DayWiseInventory";
import CreatePurchaseOrder from "../pages/inventory/CreatePurchaseOrder";
import CreateSalesOrder from "../pages/inventory/CreateSalesOrder";

// Employee Management
import EmployeeDashboard from "../pages/employees/EmployeeDashboard";
import EmployeeList from "../pages/employees/EmployeeList";
import AddEditEmployee from "../pages/employees/AddEditEmployee";
import EmployeeDetail from "../pages/employees/EmployeeDetail";
import MyProfile from "../pages/common/MyProfile";

// Marketing
import MarketingDashboard from "../modules/marketing/pages/Dashboard";
import LeadsList from "../modules/marketing/pages/LeadsList";
import LeadDetails from "../modules/marketing/pages/LeadDetails";
import AddEditLead from "../modules/marketing/pages/AddEditLead";

import { useAuth } from "../context/AuthContext";
import { ROLE_DASHBOARD_MAP } from "../types/user";
import { Navigate } from "react-router-dom";

function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_DASHBOARD_MAP[user.role]} replace />;
}

function PROServicesPage() {
  const { user } = useAuth();
  if (user?.role === "CLIENT") return <ClientPROServices />;
  return <AdminPROTracking />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ─── Public Routes ─────────────────────────────── */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* ─── Protected Routes with Dashboard Layout ─── */}
      <Route element={<DashboardLayout />}>
        {/* Dashboards (Role-based Base) */}
        <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ACCOUNTS"]} />}>
          <Route path="/accounts/dashboard" element={<AccountsDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["PROJECT_MANAGER"]} />}>
          <Route path="/pm/dashboard" element={<PMDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
        </Route>

        {/* Dynamic Sections Base on sidebarMenu permissions */}

        {/* User Management — SUPER_ADMIN only (RBAC enforced) */}
        <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} requiredSections={["User Management"]} />}>
          <Route path="/users" element={<Users />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/edit-user/:id" element={<EditUser />} />

          <Route path="/permissions" element={<Permissions />} />
        </Route>

        {/* Projects */}
        <Route element={<ProtectedRoute requiredSections={["Projects"]} />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/edit-project/:id" element={<EditProject />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/create-job" element={<CreateJob />} />
          <Route path="/job-details" element={<JobDetails />} />
        </Route>

        {/* Estimations & Sales (Consolidated) */}
        <Route element={<ProtectedRoute requiredSections={["Estimations"]} />}>
          <Route path="/boq" element={<BOQ />} />
          <Route path="/create-boq" element={<CreateBOQ />} />
          <Route path="/edit-boq/:id" element={<CreateBOQ />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/quotations/:division" element={<Quotations />} />
          <Route path="/invoices" element={<Quotations />} />
          <Route path="/invoices/:division" element={<Quotations />} />
          <Route path="/create-quotation" element={<CreateQuotation />} />
          <Route path="/create-quotation/:division" element={<CreateQuotation />} />
          <Route path="/edit-quotation/:id" element={<CreateQuotation />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/create-proposal" element={<CreateProposal />} />
          <Route path="/edit-proposal/:id" element={<CreateProposal />} />
          <Route path="/draft-proposals" element={<Proposals filter="Draft" />} />
          <Route path="/proposal-templates" element={<Proposals filter="Templates" />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/create-invoice" element={<CreateInvoice />} />
          <Route path="/create-invoice/:division" element={<CreateInvoice />} />
          <Route path="/edit-invoice/:id" element={<CreateInvoice />} />
        </Route>

        {/* Clients */}
        <Route element={<ProtectedRoute requiredSections={["Client Portal"]} />}>
          <Route path="/clients" element={<Clients />} />
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path="/create-client" element={<CreateClient />} />
          </Route>
          <Route path="/client-details/:id" element={<ClientDetails />} />
          <Route path="/edit-client/:id" element={<EditClient />} />
          <Route path="/admin/pro-tracking" element={<AdminPROTracking />} />
        </Route>

        <Route element={<ProtectedRoute requiredSections={["Accounting"]} />}>
          <Route path="/credit-control" element={<CreditControl />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/create-expense" element={<CreateExpense />} />
          <Route path="/edit-expense/:id" element={<CreateExpense />} />
          <Route path="/expense-details/:id" element={<ExpenseDetails />} />

          <Route path="/receipts" element={<Receipts />} />
          <Route path="/credit-requests" element={<CreditRequests />} />
          <Route path="/credit-request" element={<CreditRequest />} />
          <Route path="/edit-credit-request/:id" element={<CreditRequest />} />
          <Route path="/ledger" element={<Ledger />} />
        </Route>

        {/* Reports */}
        <Route element={<ProtectedRoute requiredSections={["Reports"]} />}>
          <Route path="/financial-reports" element={<FinancialReports />} />
          <Route path="/profit-loss" element={<ProfitLoss />} />
          <Route path="/balance-sheet" element={<BalanceSheet />} />
        </Route>

        {/* Inventory */}
        <Route element={<ProtectedRoute requiredSections={["Inventory"]} />}>
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/create-product" element={<CreateProduct />} />
          <Route path="/inventory/edit-product/:id" element={<CreateProduct />} />
          <Route path="/inventory-movements" element={<InventoryMovements />} />
          <Route path="/create-stock-movement" element={<CreateStockMovement />} />
          <Route path="/inventory/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/inventory/sales-orders" element={<SalesOrders />} />
          <Route path="/inventory/day-wise" element={<DayWiseInventory />} />
          <Route path="/inventory/profit-report" element={<ProfitReport />} />

          {/* Super Admin & Accounts Explicit Protections */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ACCOUNTS"]} />}>
            <Route path="/inventory/create-purchase-order" element={<CreatePurchaseOrder />} />
          </Route>

          {/* Super Admin, Accounts & PM Explicit Protections */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ACCOUNTS", "PROJECT_MANAGER"]} />}>
            <Route path="/inventory/low-stock" element={<LowStock />} />
          </Route>

          {/* Super Admin & PM Explicit Protections */}
          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER"]} />}>
             <Route path="/inventory/create-sales-order" element={<CreateSalesOrder />} />
          </Route>
        </Route>

        {/* Employee Management */}
        <Route element={<ProtectedRoute requiredSections={["Employee Management"]} />}>
          <Route path="/employees" element={<EmployeeDashboard />} />
          <Route path="/employees/list" element={<EmployeeList />} />
          <Route path="/employees/create" element={<AddEditEmployee />} />
          <Route path="/employees/edit/:id" element={<AddEditEmployee />} />
          <Route path="/employees/details/:id" element={<EmployeeDetail />} />
        </Route>

        {/* Marketing & Lead Management */}
        <Route element={<ProtectedRoute requiredSections={["Marketing"]} />}>
          <Route path="/marketing/dashboard" element={<MarketingDashboard />} />
          <Route path="/marketing/leads" element={<LeadsList />} />
          <Route path="/marketing/leads/new" element={<AddEditLead />} />
          <Route path="/marketing/leads/edit/:id" element={<AddEditLead />} />
          <Route path="/marketing/leads/:id" element={<LeadDetails />} />
        </Route>

        {/* Client Portal */}
        <Route element={<ProtectedRoute requiredSections={["Client Portal"]} />}>
          <Route path="/client/projects" element={<ClientProjects />} />
          <Route path="/client/boq" element={<ClientBOQ />} />
          <Route path="/client/billing" element={<ClientBilling />} />
          <Route path="/client/quotations" element={<ClientQuotations />} />
          <Route path="/client/documents" element={<ClientDocuments />} />
          <Route path="/pro-services" element={<PROServicesPage />} />
          <Route path="/client/pro-services" element={<ClientPROServices />} />
          <Route path="/client/support" element={<ClientSupport />} />
          <Route path="/client/credit-requests" element={<ClientCreditRequests />} />
          <Route path="/client/profile" element={<MyProfile />} />
          <Route path="/profile" element={<MyProfile />} />
        </Route>

        {/* Shared items available to basically anyone authenticated correctly */}
        <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "PROJECT_MANAGER", "ACCOUNTS", "CLIENT"]} />}>
          <Route path="/job-documents" element={<JobDocuments />} />
          <Route path="/proposal-details/:id" element={<ProposalDetails />} />
          <Route path="/invoice-details/:id" element={<InvoiceDetails />} />
          <Route path="/boq-details/:id" element={<BOQDetails />} />
          <Route path="/quotation-details/:id" element={<QuotationDetails />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;