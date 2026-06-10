import { toastSingleton } from "@/components/ui/toast/ToastProvider";

export const errorToast   = (message: string) => toastSingleton.error(message);
export const successToast = (message: string) => toastSingleton.success(message);
export const warningToast = (message: string) => toastSingleton.warning(message);
export const infoToast    = (message: string) => toastSingleton.info(message);
