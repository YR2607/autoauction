import { VehicleForm } from "@/components/admin/vehicle-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Vehicle · Admin" };

export default function NewVehiclePage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-medium">New vehicle</h1>
      <p className="mt-1 text-sm text-muted">
        Created as DRAFT. Photos and documents are uploaded on the next step, after saving.
      </p>
      <div className="mt-6">
        <VehicleForm />
      </div>
    </div>
  );
}
