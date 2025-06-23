import type { Metadata } from "next";
import DeleteAccountClientPage from "./DeleteAccountClientPage";

export const metadata: Metadata = {
  title: "Account Deletion Request - Ratna Digital",
  description: "Request to delete your account and personal data from Ratna Digital services",
};

export default function DeleteAccountPage() {
  return <DeleteAccountClientPage />;
} 