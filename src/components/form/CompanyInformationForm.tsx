"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Building2, Mail, Phone, Globe, MapPin,
  CheckCircle, Users, ArrowRight, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { companyInformationSchema } from "@/lib/validation";
import {
  useGetOrgStatusQuery,
  useRegisterOrganizationMutation,
} from "@/store/slice/apiSlice";
import { useAppSelector } from "@/hooks/useStore";
import { setUserData } from "@/store/slice/authSlice";

// ─── Explicit form type (avoids yup InferType optional/required clash with RHF) ─
interface CompanyFormValues {
  companyName: string;
  industry?: string;
  email?: string;
  companyPhone?: string;
  companyWebsite?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

// ─── Business status banner ───────────────────────────────────────────────────
function BusinessBadge({ teamCount }: { teamCount: number }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">Business Account Active</p>
          <p className="text-xs text-green-600 mt-0.5">
            {teamCount > 0
              ? `${teamCount} team member${teamCount !== 1 ? "s" : ""} in your organisation`
              : "No team members yet — invite your first one below"}
          </p>
        </div>
      </div>
      <button
        onClick={() => router.push("/dashboard/team")}
        className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900 transition-colors"
      >
        <Users className="w-4 h-4" />
        Manage Team
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Upgrade CTA ─────────────────────────────────────────────────────────────
function UpgradeCTA() {
  return (
    <div className="bg-gray-900 rounded-2xl px-5 py-5 mb-6 text-white">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-base">Upgrade to a Business Account</p>
          <p className="text-sm text-white/70 mt-1 leading-relaxed">
            Register your company to unlock team management. You'll be able to invite
            Dispatchers, Finance officers, and Viewers — each with the right level of access.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Invite Dispatchers", "Assign Finance roles", "Manage team access", "View all company shipments"].map((f) => (
              <span key={f} className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>
          <p className="text-xs text-white/50 mt-3">
            Fill in your company details below and click <strong>Register as Business</strong> to activate.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export function CompanyInformationForm() {
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = useAppSelector((s) => s.auth.user);

  const { data: statusData, isLoading: statusLoading, refetch } = useGetOrgStatusQuery();
  const [registerOrg, { isLoading: upgrading }] = useRegisterOrganizationMutation();

  const isBusiness: boolean = statusData?.data?.isBusiness ?? false;
  const teamCount: number   = statusData?.data?.teamCount   ?? 0;
  const company             = statusData?.data?.company;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyFormValues>({
    // Cast to any to avoid yup InferType ↔ RHF Resolver generic mismatch
    resolver: yupResolver(companyInformationSchema) as any,
    defaultValues: {
      companyName: "",
      industry: "",
      email: "",
      companyPhone: "",
      companyWebsite: "",
      streetAddress: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
  });

  // Pre-fill form if already a business
  useEffect(() => {
    if (company) {
      reset({
        companyName:    company.name             ?? "",
        industry:       company.industry         ?? "",
        email:          company.email            ?? "",
        companyPhone:   company.phone            ?? "",
        companyWebsite: company.website          ?? "",
        streetAddress:  company.address?.street  ?? "",
        city:           company.address?.city    ?? "",
        state:          company.address?.state   ?? "",
        country:        company.address?.country ?? "",
        zipCode:        company.address?.zip     ?? "",
      });
    }
  }, [company, reset]);

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      const result = await registerOrg({
        companyName:    data.companyName,
        industry:       data.industry       || undefined,
        companyEmail:   data.email          || undefined,
        companyPhone:   data.companyPhone   || undefined,
        companyWebsite: data.companyWebsite || undefined,
        streetAddress:  data.streetAddress  || undefined,
        city:           data.city           || undefined,
        state:          data.state          || undefined,
        country:        data.country        || undefined,
        zipCode:        data.zipCode        || undefined,
      }).unwrap();

      if (result?.data?.user) {
        dispatch(setUserData(result.data.user));
      }

      refetch();
    } catch {
      // errors surfaced via apiSlice toast
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading business status…
      </div>
    );
  }

  return (
    <div>
      {isBusiness ? <BusinessBadge teamCount={teamCount} /> : <UpgradeCTA />}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Company Name *"
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
            label="Company Email"
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

        {/* Address */}
        <div className="flex flex-col gap-4">
          <p className="font-medium text-base text-gray-800">Address Information</p>
          <Input
            label="Street Address"
            type="text"
            leftIcon={<MapPin size={15} />}
            error={errors.streetAddress?.message}
            {...register("streetAddress")}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City"    type="text" error={errors.city?.message}    {...register("city")} />
            <Input label="State"   type="text" error={errors.state?.message}   {...register("state")} />
            <Input label="Country" type="text" error={errors.country?.message} {...register("country")} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="ZIP Code" type="text" error={errors.zipCode?.message} {...register("zipCode")} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={upgrading} disabled={!isDirty && isBusiness}>
            {isBusiness ? "Update Company Details" : "Register as Business"}
          </Button>
          {!isBusiness && (
            <p className="text-xs text-gray-400">
              You'll immediately gain access to team management.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
