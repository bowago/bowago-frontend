import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IStatus, TokenDetails, UserModel } from "./types";

export type Role = "ADMIN" | "CUSTOMER" | "courier";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserModel | null;
  // Gap 5: track when 2FA was last completed so the invoice page can enforce the gate
  mfaVerifiedAt: string | null;
}

const initialState: AuthState = {
  user: null,
  refreshToken: null,
  accessToken: null,
  mfaVerifiedAt: null,
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
      state.mfaVerifiedAt = null;
    },
    adjustUsedToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setUserData: (state, action) => {
      state.user = action.payload;
    },
    // Gap 5: called after successful 2FA login verification
    setMfaVerified: (state, action: PayloadAction<string>) => {
      state.mfaVerifiedAt = action.payload; // ISO timestamp
    },
  },
});

export const { authTokenChange, logoutUser, adjustUsedToken, setUserData, setMfaVerified } =
  authSlice.actions;
export default authSlice.reducer;
