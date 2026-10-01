import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route, useLocation, Navigate, Link } from "react-router";
import AuthPage from "@/pages/Auth.tsx";
import { RequireAuth } from "@/components/RequireAuth.tsx";
import LandingPage from "@/pages/Landing.tsx";
import NotFoundPage from "@/pages/NotFound.tsx";
import { ExportButton } from "@/components/app/ExportButton.tsx";
import { rowsToCsv, downloadCsv, datedFilename, autoColumns } from "@/lib/export.ts";
import { computeGudangRows, PENGELUARAN_JENISES } from "@/lib/business.ts";
import P0 from "@/pages/app/AbsensiPage.tsx";
import P1 from "@/pages/app/AdminPage.tsx";
import P2 from "@/pages/app/BarangMasukPage.tsx";
import P3 from "@/pages/app/BarangPage.tsx";
import P4 from "@/pages/app/DashboardPage.tsx";
import P5 from "@/pages/app/DplPage.tsx";
import P6 from "@/pages/app/GudangPage.tsx";
import P7 from "@/pages/app/InvoicePage.tsx";
import P8 from "@/pages/app/KaryawanPage.tsx";
import P9 from "@/pages/app/KasPage.tsx";
import P10 from "@/pages/app/KatalogPage.tsx";
import P11 from "@/pages/app/LaporanPage.tsx";
import P12 from "@/pages/app/LaporanTetesanPage.tsx";
import P13 from "@/pages/app/MasterTetesanPage.tsx";
import P14 from "@/pages/app/MigrationPage.tsx";
import P15 from "@/pages/app/MonitorPage.tsx";
import P16 from "@/pages/app/PasarPage.tsx";
import P17 from "@/pages/app/PengeluaranPage.tsx";
import P18 from "@/pages/app/PiutangPage.tsx";
import P19 from "@/pages/app/ResellerPage.tsx";
import P20 from "@/pages/app/ReturPage.tsx";
import P21 from "@/pages/app/SlipGajiPage.tsx";
import P22 from "@/pages/app/SupplierPage.tsx";
import P23 from "@/pages/app/SyncDataPage.tsx";
import P24 from "@/pages/app/TetesanPage.tsx";
import P25 from "@/pages/app/UtangPage.tsx";

export {
  React, act, createRoot, renderToString, MemoryRouter, Routes, Route,
  useLocation, Navigate, Link, AuthPage, RequireAuth, LandingPage, NotFoundPage,
  ExportButton, rowsToCsv, downloadCsv, datedFilename, autoColumns,
  computeGudangRows, PENGELUARAN_JENISES,
};
export const PAGES = {
  "AbsensiPage": P0,
  "AdminPage": P1,
  "BarangMasukPage": P2,
  "BarangPage": P3,
  "DashboardPage": P4,
  "DplPage": P5,
  "GudangPage": P6,
  "InvoicePage": P7,
  "KaryawanPage": P8,
  "KasPage": P9,
  "KatalogPage": P10,
  "LaporanPage": P11,
  "LaporanTetesanPage": P12,
  "MasterTetesanPage": P13,
  "MigrationPage": P14,
  "MonitorPage": P15,
  "PasarPage": P16,
  "PengeluaranPage": P17,
  "PiutangPage": P18,
  "ResellerPage": P19,
  "ReturPage": P20,
  "SlipGajiPage": P21,
  "SupplierPage": P22,
  "SyncDataPage": P23,
  "TetesanPage": P24,
  "UtangPage": P25,
};
