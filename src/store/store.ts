import authReducer from "@/store/slice/authSlice";
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { apiSlice } from "./slice/apiSlice";

const persistConfig = {
  key: "auth",
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      // These dev-mode checks deep-clone and walk the entire Redux state on
      // every action — with a large apiSlice cache they add 100ms+ per action
      // and cause the "ImmutableStateInvariantMiddleware took 99ms" warning.
      // Disabling them removes a major source of RAM pressure in dev.
      immutableCheck: false,
      actionCreatorCheck: false,
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
