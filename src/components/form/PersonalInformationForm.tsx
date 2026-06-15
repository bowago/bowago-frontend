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
  useUpsertDefaultAddressMutation,
} from "@/store/slice/apiSlice";
import { useEffect, useRef } from "react";

export function PersonalInformationForm() {
  const { data: userData, isLoading } = useGetUserProfileQuery({});
  const [handleUpdateUserProfile, { isLoading: isUpdatingProfile }] =
    useUpdateUserProfileMutation({});
  const [upsertAddress, { isLoading: isSavingAddress }] =
    useUpsertDefaultAddressMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(personalInformationSchema),
  });

  // Track the default address ID so we PUT (update) instead of POST (create)
  // on subsequent saves.
  const defaultAddressId = useRef<string | null>(null);

  useEffect(() => {
    if (userData) {
      const resData = userData?.data?.user;
      setValue("email", resData?.email);
      setValue("firstName", resData?.firstName);
      setValue("lastName", resData?.lastName);
      setValue("phone", resData?.phone);

      // Pre-fill address fields from the user's default address, if any
      const addresses = resData?.addresses ?? [];
      const defaultAddress =
        addresses.find((a: any) => a.isDefault) ?? addresses[0] ?? null;

      if (defaultAddress) {
        defaultAddressId.current = defaultAddress.id;
        setValue("streetAddress", defaultAddress.street);
        setValue("city", defaultAddress.city);
        setValue("state", defaultAddress.state);
        setValue("country", defaultAddress.country);
        setValue("zipCode", defaultAddress.postalCode ?? "");
      }
    }
  }, [userData]);

  const onSubmit = async (data: PersonalInformationFormData) => {
    // Update first/last name, phone (email is read-only — changing it
    // requires re-verification, not supported here)
    await handleUpdateUserProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    // Save address only if at least street + city + state are filled —
    // the Address model requires these fields.
    if (data.streetAddress && data.city && data.state) {
      await upsertAddress({
        existingId: defaultAddressId.current,
        street: data.streetAddress,
        city: data.city,
        state: data.state,
        country: data.country || "Nigeria",
        postalCode: data.zipCode || undefined,
      });
    }
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
          disabled
          error={errors.email?.message as string}
          {...register("email")}
        />
      </div>
      <p className="text-xs text-gray-400 -mt-4">
        Email address can't be changed here. Contact support if you need to
        update it.
      </p>

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
        <div>
          <p className="font-medium text-lg">Address Information</p>
          <p className="text-xs text-gray-400">
            This is saved as your default shipping address and used to
            pre-fill the sender details when creating a shipment.
          </p>
        </div>

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
        <Button type="submit" isLoading={isUpdatingProfile || isSavingAddress}>
          Save
        </Button>
      </div>
    </form>
  );
}
