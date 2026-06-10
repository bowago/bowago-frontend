export interface IPasswordUpdate {
  currentPassword: string;
  newPassword: string;
}
export interface IResetPassword {
  email: string;
  code: string;
  newPassword: string;
}

export interface IAppResetPassword {
  password: string;
  token: string;
}

export interface IContactUpdate {
  name: string;
  email: string;
}
export interface IUpdateEmployee {
  employeeId: string;
  name: string;
  phoneNumber: string;
  salary: string;
}
export interface IDeleteEmployee {
  employeeId: number[] | string[];
}
