export type Staff = {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  salary: string;
};

export interface StaffResponseData {
  message: string;
  data: { records: Staff[] };
}
