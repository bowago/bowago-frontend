"use client";
import { useRouter } from "next/navigation";
import AddActionCard from "@/components/cards/AddCard";
import ContractRateManagementView from "@/components/layout/ContractRateManagementView";
import PromoCodeManagementView from "@/components/layout/PromoCodeManagementView";
import StandardRateManagementView from "@/components/layout/StandardRateManagementView";
import DeliverySLAManagementView from "@/components/layout/DeliverySLAManagementView";
import CreateRateModal, { RateType } from "@/components/modals/CreateRateModal";
import ImportPricingModal from "@/components/modals/ImportPricingModal";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs/tabs";
import { LocationEdit, Package, ReceiptText, Route, Upload, Download } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetRateOverviewQuery, useExportPricingSheetMutation } from "@/store/slice/apiSlice";

export default function ShipmentsPage() {
  const { data, isLoading, refetch } = useGetRateOverviewQuery({});
  const [selected, setSelected] = useState<RateType>("standard");
  const [exportPricing, { isLoading: exporting }] = useExportPricingSheetMutation();

  const me = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = (me as any)?.adminSubRole === "SUPER_ADMIN";

  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false);
  const router = useRouter();

  const stat = data?.data ?? {};

  return (
    <div className=" space-y-10">
      <div className="flex flex-row justify-between flex-1 items-center gap-3 flex-wrap">
        <h1 className="dashboard-heading">Rate Management</h1>

        <div className="flex items-center gap-3">
          {/* Export Pricing Sheet — Super Admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => exportPricing()}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting…" : "Export Sheet"}
            </button>
          )}

          {/* Import Pricing Sheet — bulk Excel upload */}
          <ImportPricingModal
            onSuccess={() => refetch()}
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                Import Sheet
              </button>
            }
          />

          <Button
            onClick={() => {
              setSelected("standard");
              setIsOpenCreateModal(true);
            }}
          >
            Create Rate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <AddActionCard
          icon={<LocationEdit className="w-6 h-6 text-orange-500" />}
          iconBg="bg-orange-50"
          value={
            isLoading ? "..." : `${stat?.totalZone?.toLocaleString() ?? "0"}`
          }
          label="Total zone"
          addText={"Add New Zone"}
          onClick={() => router.push("/dashboard/rate/zones")}
          delay={0}
        />
        <AddActionCard
          icon={<Route className="w-6 h-6 text-purple-500" />}
          iconBg="bg-purple-50"
          value={
            isLoading
              ? "..."
              : `${stat?.totalRegisteredCity?.toLocaleString() ?? "0"}`
          }
          label="Total Registered City"
          addText={"Add New City"}
          onClick={() => router.push("/dashboard/rate/cities")}
          delay={80}
        />
        <AddActionCard
          icon={<ReceiptText className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-50"
          value={
            isLoading
              ? "..."
              : `${stat?.totalContractRate?.toLocaleString() ?? "0"}`
          }
          label="Total Contract rate"
          addText={"Add New Contract Rate"}
          onClick={() => {
            setSelected("contract");
            setIsOpenCreateModal(true);
          }}
          delay={160}
        />
        <AddActionCard
          icon={<Package className="w-6 h-6 text-pink-400" />}
          iconBg="bg-pink-50"
          value={
            isLoading
              ? "..."
              : `${stat?.totalBoxDimension?.toLocaleString() ?? "0"}`
          }
          label="Total Box"
          addText={"Add New Box"}
          onClick={() => router.push("/dashboard/rate/boxes")}
          delay={240}
        />
      </div>

      <Tabs defaultValue={"standard"}>
        <TabsList defaultChecked>
          <TabsTrigger value="standard">Standard Rate</TabsTrigger>
          <TabsTrigger value="contract">Contract Rate</TabsTrigger>
          <TabsTrigger value="promo">Promo Code</TabsTrigger>
          <TabsTrigger value="delivery-sla">Delivery SLA</TabsTrigger>
        </TabsList>
        <div className="mt-5">
          <TabsContent value="standard" className="w-full flex flex-col gap-6">
            <StandardRateManagementView />
          </TabsContent>
          <TabsContent value="contract" className="w-full">
            <ContractRateManagementView />
          </TabsContent>
          <TabsContent value="promo" className="w-full">
            <PromoCodeManagementView />
          </TabsContent>
          <TabsContent value="delivery-sla" className="w-full">
            <DeliverySLAManagementView />
          </TabsContent>
        </div>
      </Tabs>

      <CreateRateModal
        isOpen={isOpenCreateModal}
        setIsOpen={setIsOpenCreateModal}
        defaultRate={selected}
      />
    </div>
  );
}
