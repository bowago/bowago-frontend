import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IStatus, TokenDetails, UserModel } from "./types";

export type Role = "ADMIN" | "CUSTOMER" | "courier";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserModel | null;
}

const initialState: AuthState = {
  user: null,
  refreshToken: null,
  accessToken: null,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authTokenChange: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    logoutUser: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
    },
    adjustUsedToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setUserData: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { authTokenChange, logoutUser, adjustUsedToken, setUserData } =
  authSlice.actions;
export default authSlice.reducer;
