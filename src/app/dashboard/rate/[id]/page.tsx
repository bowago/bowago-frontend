"use client";
import ShipmentDetailView from "@/components/layout/ShippingDetailsView";
import { documentColumns } from "@/components/table/columns/document-columns";
import { AppTable } from "@/components/table/Table";
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "@/components/ui/tabs/tabs";
import { documentsData } from "@/lib/dummy-data/clearance-document";
import { Filter, MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ShipmentDetails() {
  let id = "BOWAGO-001-002";
  const router = useRouter();
  const [filters, setFilters] = useState({
    name: "",
    type: "",
    status: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const filteredData = documentsData.filter((doc) => {
    return (
      doc.name.toLowerCase().includes(appliedFilters.name.toLowerCase()) &&
      doc.type.toLowerCase().includes(appliedFilters.type.toLowerCase()) &&
      doc.status.toLowerCase().includes(appliedFilters.status.toLowerCase())
    );
  });

  const handleChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    const empty = {
      name: "",
      type: "",
      status: "",
    };

    setFilters(empty);
    setAppliedFilters(empty);
  };

  const removeFilter = (key: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [key]: "",
    }));

    setFilters((prev) => ({
      ...prev,
      [key]: "",
    }));
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <MoveLeft />
        </button>

        <h2 className="text-xl font-semibold">Shipments / {id}</h2>
      </div>

      <Tabs defaultValue={"shipment"}>
        <TabsList defaultChecked>
          <TabsTrigger value="shipment">Shipment Details</TabsTrigger>
          <TabsTrigger value="clearance">Clearance Documents</TabsTrigger>
        </TabsList>
        <div className="mt-5">
          <TabsContent value="shipment" className="w-full flex flex-col gap-6">
            {/* Shippping details */}
            <div className="flex flex-col gap-5">
              <div className="bg-black text-white rounded-lg p-6">
                <div className="flex justify-between">
                  <div>
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs">
                      In Transit
                    </span>

                    <h3 className="text-lg mt-3">Los Angeles, USA</h3>

                    <p className="text-gray-300 text-sm">
                      From: Lagos, Nigeria
                    </p>
                  </div>

                  <div className="text-right">
                    <p>BOWAGO-001-002</p>
                    <p className="text-gray-300 text-sm">
                      Tracking ID: 111101023
                    </p>
                  </div>
                </div>

                <div className="mt-6 h-2 bg-gray-700 rounded">
                  <div className="h-2 bg-red-600 w-[70%] rounded" />
                </div>

                <div className="mt-3">
                  <p className="text-gray-300 text-sm">Arrival Date</p>
                  <h3 className="text-base ">March 20, 2026</h3>
                </div>
              </div>

              <ShipmentDetailView />
            </div>
          </TabsContent>
          <TabsContent value="clearance" className="w-full">
            <div>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col">
                  <label className="text-sm mb-1">Document Name</label>
                  <input
                    value={filters.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="border rounded-md p-2"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm mb-1">Document Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="border rounded-md p-2"
                  >
                    <option value="">Select option</option>
                    <option value="PDF">PDF</option>
                    <option value="JPEG">JPEG</option>
                    <option value="DOCS">DOCS</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="border rounded-md p-2"
                  >
                    <option value="">Select option</option>
                    <option value="pending">Pending</option>
                    <option value="uploaded">Uploaded</option>
                  </select>
                </div>

                <button
                  onClick={applyFilters}
                  className="bg-red-600 text-white px-5 py-2 rounded-md flex gap-2 items-center"
                >
                  Filter <Filter size={16} />
                </button>
              </div>

              {/* Applied Filters */}

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500">Applied Filters:</span>

                {Object.entries(appliedFilters).map(([key, value]) =>
                  value ? (
                    <span
                      key={key}
                      className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm"
                    >
                      {key}: {value}
                      <button
                        onClick={() => removeFilter(key)}
                        className="text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  ) : null,
                )}

                {Object.values(appliedFilters).some(Boolean) && (
                  <button
                    onClick={clearFilters}
                    className="text-red-600 text-sm font-medium ml-2"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Total Records */}

              <div className="flex justify-end text-sm text-gray-600">
                Total Records: 1000
              </div>

              <AppTable columns={documentColumns} data={filteredData} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
