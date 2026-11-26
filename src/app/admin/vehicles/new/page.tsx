import { VehicleForm } from "@/components/admin/vehicle-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Vehicle | Admin" };

export default function NewVehiclePage() {
  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">New Vehicle</h1>
      <p className="mt-0.5 text-xs text-[#64748b]">Created as DRAFT. Publish when ready.</p>
      <div className="mt-4 max-w-4xl">
        <VehicleForm />
      </div>
    </div>
  );
}
