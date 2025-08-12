# 📦 Vendor -- ERP Supply Chain Management System — Frontend

Welcome to the **ERP UI Repository** for our intelligent supply chain management platform. This system streamlines stock tracking, order management, and delivery operations — tailored for Manufacturer, Employees, and Retailers with a smart, role-based interface.

---
# Features
## 🔐 Authentication & Access Control

- **Login Page**: Secure login system with Django access token authentication.
- **User Roles**: Manufacturer, Employee, and Retailer dashboards based on login credentials.

---

## 🌐 Role-Based Dashboards

### 🧭 Manufacturer Dashboard
- Real-time **stock levels**, **sales**, and **order tracking**.
- **Auto-order allocation system** to assign tasks to employees intelligently.
- **Reports and analytics** with visualizations like bar charts and graphs.

### 🚚 Employee Dashboard
- **Assigned delivery tasks** and order fulfillment interface.
- **Shipping details** and package tracking module.
- Real-time **instructions** and update system.

### 🛒 Retailer Dashboard
- Browse and **place orders** based on available stock.
- Track **order status** with live updates.
- Instant **notifications** on fulfillment or delays.

---

## 📦 Stock Management Module

- **Stock Count**: Inventory metrics and real-time count.
- **Stock Overview**: Product availability and movement.
- **Stock Overview Graph**: Visual chart of supply and demand.
- **High Demand Alerts**: AI-based notification of fast-moving SKUs.
- **Add Product**: Interface for registering new products.

---

## 💰 Accounting & Billing

- **Create New Bill**: Generate bills and track invoices.
- **Add New Customer**: Customer creation and CRM module.
- **Customer Invoices**: View and manage past invoices.
- **Vendor Bills**: Manage purchase-side bills from suppliers.
- **Track Payments**: Visual payment tracking with due alerts.
- **Configure Documents**: Customize invoice/bill formats.

---

## 👤 User Profile & Configuration

- **User Details**: Update personal and role-based information.
- **Third-party Integration**: Connect with external systems (e.g., accounting APIs, logistics).
- **Company Configuration**:
  - **Create Company**
  - **Manage Company Details**

---

## 🧠 IoT & AI Integration

> *(via IMX500 Sensor – on Backend)*  
An edge AI package powers vision-based automation:
- **QR & Box Detection** for order tracking
- **Defect/Mismatch Detection** for quality assurance
- **Low-latency edge inference** using OpenCV, YOLOv5, and MobileNet
- Data transmitted via MQTT

---

## 🛠️ Backend Overview (Deployed and Handled Privately in Separate Repository) 
>**Note**: Just for information 
## 📺 Demo Preview

![Demo](public/IOT-Demo.gif)

Watch the full backend demo here 👉 [Watch on YouTube](https://www.youtube.com/watch?v=Dpkl4f1OeJ0)
> Built using Django and Django REST Framework — logic and automation powered from the backend.

### 🔄 Automatic Order Allocation
- Orders from retailers are auto-assigned to employees based on workload, shift, and proximity.

### 📦 Dynamic Stock Management
- Real-time supply task completion auto-updates stock levels.
- Reduces manual intervention & ensures live accuracy.

### 🔐 REST API Integration
- Secure, token-based endpoints.
- Fully modular and scalable for POS or ERP integration.

---

## 📦 IoT Edge-AI Package (IMX500)

> A smart hardware-vision interface that brings intelligence to package handling and verification.

### 🧠 Vision Capabilities
- **QR Code Detection**: For rapid box verification.
- **Defect Detection**: Identifies mismatched or damaged inventory.

### 🌐 Edge Communication
- AI runs on-device (Sony IMX500) with low latency.
- Uses MQTT to send real-time insights to the backend.

---

## 💻 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** |  TypeScript, TailwindCSS, React |
| **Backend** | Django, Django REST Framework |
| **Database** | PostgreSQL |
| **IoT / AI** | IMX500, OpenCV, YOLOv5, MobileNet |
| **Deployment** | Railway, Docker, Gunicorn |

---

# 🚀 Frontend Setup Guide
**For Developers to help with Easy Installation, Configuration, and Seamless Operations**

## 🧩 Overview
This comprehensive guide is designed to help you get started with the frontend of the Ignyte project. It provides step-by-step instructions for installation, configuration, and running the development server, ensuring a smooth setup process for developers at all experience levels.

## 📦 Setup Instructions

- 🌐 Navigate to the frontend folder
  ```bash
  git clone https://github.com/Vendor-Innovate-Solutions/Vendor-frontend
  cd Vendor-frontend
- 📥 **Install dependencies**
  ```bash
  npm i
- 🔄 **Start the development server**
  ```bash
  npm run dev
- 🖥️ **Visit in browser Open**
  ```bash
  http://localhost:3000
>**Note**: The backend allows only port 3000 by default 
- 📋 **Prerequisites**
  ```bash
  Node.js (v16+ recommended)
  npm (comes bundled with Node.js)
