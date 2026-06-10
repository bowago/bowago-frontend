"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Building2, Mail, Phone, Globe, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CompanyInformationFormData,
  companyInformationSchema,
} from "@/lib/validation";

export function CompanyInformationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(companyInformationSchema),
  });

  const onSubmit = (data: CompanyInformationFormData) => {
    console.log("Company Info:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Company Name"
          type="text"
          leftIcon={<Building2 size={15} />}
          error={errors.companyName?.message}
          {...register("companyName")}
        />

        <Input
          label="Industry"
          type="text"
          error={errors.industry?.message}
          {...register("industry")}
        />

        <Input
          label="Email Address"
          type="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register("email")}
        />
      </div>

      {/* Row 2 */}

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Company Phone"
          type="tel"
          leftIcon={<Phone size={15} />}
          error={errors.companyPhone?.message}
          {...register("companyPhone")}
        />

        <Input
          label="Company Website"
          type="text"
          leftIcon={<Globe size={15} />}
          error={errors.companyWebsite?.message}
          {...register("companyWebsite")}
        />
      </div>

      {/* Address Section */}

      <div className="flex flex-col gap-4">
        <p className="font-medium text-lg">Address Information</p>

        <Input
          label="Street Address"
          type="text"
          leftIcon={<MapPin size={15} />}
          error={errors.streetAddress?.message}
          {...register("streetAddress")}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="City"
            type="text"
            error={errors.city?.message}
            {...register("city")}
          />

          <Input
            label="State"
            type="text"
            error={errors.state?.message}
            {...register("state")}
          />

          <Input
            label="Country"
            type="text"
            error={errors.country?.message}
            {...register("country")}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="ZIP Code"
            type="text"
            error={errors.zipCode?.message}
            {...register("zipCode")}
          />
        </div>
      </div>

      {/* Save */}

      <div className="flex">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
