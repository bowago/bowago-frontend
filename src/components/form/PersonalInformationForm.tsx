"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { User, Mail, Phone, MapPin } from "lucide-react";

import {
  personalInformationSchema,
  PersonalInformationFormData,
} from "@/lib/validation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} from "@/store/slice/apiSlice";
import { useEffect } from "react";

export function PersonalInformationForm() {
  const { data: userData, isLoading } = useGetUserProfileQuery({});
  const [handleUpdateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation({});
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(personalInformationSchema),
  });

  useEffect(() => {
    if (userData) {
      let resData = userData?.data?.user;
      console.log(resData);
      setValue("email", resData?.email);
      setValue("firstName", resData?.firstName);
      setValue("lastName", resData?.lastName);
      setValue("phone", resData?.phone);
    }
  }, [userData]);

  const onSubmit = (data: PersonalInformationFormData) => {
    handleUpdateUserProfile(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Row 1 */}
      {isLoading && <p>...loading user data</p>}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="First Name"
          type="text"
          leftIcon={<User size={15} />}
          error={errors.firstName?.message as string}
          {...register("firstName")}
        />

        <Input
          label="Last Name"
          type="text"
          leftIcon={<User size={15} />}
          error={errors.lastName?.message as string}
          {...register("lastName")}
        />

        <Input
          label="Email Address"
          type="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message as string}
          {...register("email")}
        />
      </div>

      {/* Phone */}

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Phone Number"
          type="tel"
          leftIcon={<Phone size={15} />}
          error={errors.phone?.message as string}
          {...register("phone")}
        />
      </div>

      {/* Address Section */}

      <div className="flex flex-col gap-4">
        <p className="font-medium text-lg">Address Information</p>

        <Input
          label="Street Address"
          type="text"
          leftIcon={<MapPin size={15} />}
          error={errors.streetAddress?.message as string}
          {...register("streetAddress")}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="City"
            type="text"
            error={errors.city?.message as string}
            {...register("city")}
          />

          <Input
            label="State"
            type="text"
            error={errors.state?.message as string}
            {...register("state")}
          />

          <Input
            label="Country"
            type="text"
            error={errors.country?.message as string}
            {...register("country")}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="ZIP Code"
            type="text"
            error={errors.zipCode?.message as string}
            {...register("zipCode")}
          />
        </div>
      </div>

      {/* Save Button */}

      <div className="pt-2">
        <Button type="submit" isLoading={isUpdating}>
          Save
        </Button>
      </div>
    </form>
  );
}
