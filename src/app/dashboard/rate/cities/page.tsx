"use client";

import CitiesRateManagementView from "@/components/layout/CitiesRateManagementView";
import ShipmentView from "@/components/layout/ShipmentView";
import AddCitiesModal from "@/components/modals/AddCitiesModal";
import ImportZoneCityModal from "@/components/modals/ImportZoneCityModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useExportZoneCitySheetMutation } from "@/store/slice/apiSlice";
import { Upload, Download } from "lucide-react";

export default function Page() {
  const [isOpenCityModal, setIsOpenCityModal] = useState(false);
  const [exportZoneCity, { isLoading: exporting }] = useExportZoneCitySheetMutation();

  return (
    <div className=" space-y-6">
      <div className="flex flex-row justify-between flex-1 items-center gap-3 flex-wrap">
        <h1 className="dashboard-heading">All Cities</h1>

        <div className="flex items-center gap-3">
          {/* Export/Import Zone & City data — Super Admin, or a Role Admin
              granted the "canManageRates" capability. Same template used
              both ways, and interchangeable with the full pricing sheet. */}
          <button
            onClick={() => exportZoneCity()}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export"}
          </button>
          <ImportZoneCityModal
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                Import
              </button>
            }
          />
          <Button onClick={() => setIsOpenCityModal(true)}>Add New City</Button>
        </div>
      </div>
      <CitiesRateManagementView />

      <AddCitiesModal isOpen={isOpenCityModal} setIsOpen={setIsOpenCityModal} />
    </div>
  );
}
